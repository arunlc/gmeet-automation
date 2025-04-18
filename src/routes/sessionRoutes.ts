import express, { Request, Response } from 'express';
import { Session } from '../models/Session';

const router = express.Router();

// Get all sessions
router.get('/', async (req: Request, res: Response) => {
  try {
    const sessions = await Session.find().sort({ startTime: 1 });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching sessions', error });
  }
});

// Create new session
router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, meetLink, startTime, duration, participants } = req.body;
    
    const session = new Session({
      title,
      meetLink,
      startTime: new Date(startTime),
      duration,
      participants
    });

    await session.save();
    res.status(201).json(session);
  } catch (error) {
    res.status(400).json({ message: 'Error creating session', error });
  }
});

// Get upcoming sessions (sessions starting in next 24 hours)
router.get('/upcoming', async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    const sessions = await Session.find({
      startTime: { 
        $gte: now,
        $lte: next24Hours
      },
      status: 'scheduled'
    }).sort({ startTime: 1 });

    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching upcoming sessions', error });
  }
});

// Update session
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const session = await Session.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    res.json(session);
  } catch (error) {
    res.status(400).json({ message: 'Error updating session', error });
  }
});

// Delete session
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const session = await Session.findByIdAndDelete(req.params.id);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting session', error });
  }
});

// Update attendance for a session
router.post('/:id/attendance', async (req: Request, res: Response) => {
  try {
    const { email, joinTime, leaveTime } = req.body;
    const session = await Session.findById(req.params.id);
    
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    if (!session.attendance) {
      session.attendance = {};
    }

    session.attendance[email] = {
      joinTime: joinTime ? new Date(joinTime) : undefined,
      leaveTime: leaveTime ? new Date(leaveTime) : undefined
    };

    await session.save();
    res.json(session);
  } catch (error) {
    res.status(400).json({ message: 'Error updating attendance', error });
  }
});

export default router;
