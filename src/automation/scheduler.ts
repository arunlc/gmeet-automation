import { Session } from '../models/Session';
import { meetAutomation } from './meetAutomation';

export class SessionScheduler {
  private checkInterval: NodeJS.Timeout | null = null;

  start() {
    // Check for upcoming sessions every minute
    this.checkInterval = setInterval(this.checkUpcomingSessions.bind(this), 60000);
    console.log('Session scheduler started');
  }

  private async checkUpcomingSessions() {
    try {
      const now = new Date();
      const tenMinutesFromNow = new Date(now.getTime() + 10 * 60000);

      // Find sessions that should start within the next 10 minutes
      const upcomingSessions = await Session.find({
        startTime: {
          $gte: now,
          $lte: tenMinutesFromNow
        },
        status: 'scheduled',
        'automation.meetStarted': false
      });

      for (const session of upcomingSessions) {
        this.handleSessionStart(session);
      }

    } catch (error) {
      console.error('Error checking upcoming sessions:', error);
    }
  }

  private async handleSessionStart(session: any) {
    try {
      await meetAutomation.init();
      await meetAutomation.joinMeet(session);
      await meetAutomation.startRecording(session);
    } catch (error) {
      console.error(`Failed to handle session ${session._id}:`, error);
    }
  }

  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    console.log('Session scheduler stopped');
  }
}

export const sessionScheduler = new SessionScheduler();
