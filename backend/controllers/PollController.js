const CampusPoll = require('../models/CampusPoll');
const { createNotification } = require('../utils/notificationHelper');

const PollController = {
  // Get active polls with user's vote state
  getPolls: async (req, res) => {
    try {
      const userId = req.user.id;
      const polls = await CampusPoll.find().sort({ createdAt: -1 });

      const enriched = polls.map(p => {
        const pObj = p.toObject();
        let userVotedOptionId = null;

        p.options.forEach(opt => {
          if (opt.voters && opt.voters.some(v => v.toString() === userId.toString())) {
            userVotedOptionId = opt.optionId;
          }
        });

        pObj.hasVoted = !!userVotedOptionId;
        pObj.userVotedOptionId = userVotedOptionId;
        return pObj;
      });

      return res.status(200).json(enriched);
    } catch (error) {
      console.error('Error fetching campus polls:', error);
      return res.status(500).json({ message: 'Error retrieving campus polls.' });
    }
  },

  // Cast a vote
  castVote: async (req, res) => {
    try {
      const userId = req.user.id;
      const { pollId } = req.params;
      const { optionId } = req.body;

      if (!optionId) {
        return res.status(400).json({ message: 'Please select an option to vote.' });
      }

      const poll = await CampusPoll.findById(pollId);
      if (!poll) return res.status(404).json({ message: 'Poll not found.' });

      if (poll.status === 'Closed' || new Date() > new Date(poll.expiresAt)) {
        return res.status(400).json({ message: 'This poll has ended.' });
      }

      // Check if user already voted in ANY option of this poll
      const alreadyVoted = poll.options.some(opt =>
        opt.voters && opt.voters.some(v => v.toString() === userId.toString())
      );

      if (alreadyVoted) {
        return res.status(400).json({ message: 'You have already voted in this poll.' });
      }

      const targetOption = poll.options.find(opt => opt.optionId === optionId);
      if (!targetOption) {
        return res.status(400).json({ message: 'Invalid option selected.' });
      }

      targetOption.votesCount = (targetOption.votesCount || 0) + 1;
      targetOption.voters.push(userId);

      await poll.save();

      return res.status(200).json({
        message: 'Vote recorded successfully! Thank you for your feedback.',
        poll
      });
    } catch (error) {
      console.error('Error casting vote:', error);
      return res.status(500).json({ message: 'Error submitting your vote.' });
    }
  },

  // Create a new poll (Admin / Warden)
  createPoll: async (req, res) => {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      const { title, description, category, targetAudience, options, durationDays } = req.body;

      if (!title || !options || !Array.isArray(options) || options.length < 2) {
        return res.status(400).json({ message: 'Poll title and at least 2 options are required.' });
      }

      const formattedOptions = options.map((opt, idx) => ({
        optionId: `opt_${Date.now()}_${idx}`,
        text: typeof opt === 'string' ? opt.trim() : opt.text.trim(),
        votesCount: 0,
        voters: []
      }));

      const days = Number(durationDays) || 7;
      const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

      const newPoll = new CampusPoll({
        title,
        description: description || '',
        category: category || 'General',
        targetAudience: targetAudience || 'All',
        options: formattedOptions,
        createdBy: userId,
        creatorModel: userRole,
        creatorName: req.user.name || `${userRole} Office`,
        expiresAt,
        status: 'Active'
      });

      await newPoll.save();

      // Notify relevant audience
      await createNotification(
        'All',
        'Student',
        `New Campus Poll: ${title}`,
        `Have your say on "${title}". Cast your vote on the Student Voice hub.`,
        'notice'
      );

      return res.status(201).json({ message: 'Campus poll published successfully!', poll: newPoll });
    } catch (error) {
      console.error('Error creating poll:', error);
      return res.status(500).json({ message: 'Error creating campus poll.' });
    }
  },

  // Close a poll
  closePoll: async (req, res) => {
    try {
      const { pollId } = req.params;
      const poll = await CampusPoll.findById(pollId);
      if (!poll) return res.status(404).json({ message: 'Poll not found.' });

      poll.status = 'Closed';
      await poll.save();

      return res.status(200).json({ message: 'Poll has been closed.', poll });
    } catch (error) {
      console.error('Error closing poll:', error);
      return res.status(500).json({ message: 'Error closing poll.' });
    }
  }
};

module.exports = PollController;
