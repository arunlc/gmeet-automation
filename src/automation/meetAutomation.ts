import puppeteer from 'puppeteer';
import { Session } from '../models/Session';

class MeetAutomation {
  private browser: puppeteer.Browser | null = null;
  private page: puppeteer.Page | null = null;

  async init() {
    try {
      this.browser = await puppeteer.launch({
        headless: false, // We need headful mode for Meet
        args: [
          '--use-fake-ui-for-media-stream',
          '--disable-audio-output',
          '--disable-notifications'
        ]
      });
      this.page = await this.browser.newPage();
    } catch (error) {
      console.error('Failed to initialize automation:', error);
      throw error;
    }
  }

  async joinMeet(session: any) {
    try {
      if (!this.page) throw new Error('Browser not initialized');

      // Navigate to Meet URL
      await this.page.goto(session.meetLink, { waitUntil: 'networkidle0' });

      // Wait for and click dismiss button if it appears (for Google login notice)
      try {
        await this.page.waitForSelector('button[aria-label="Dismiss"]', { timeout: 5000 });
        await this.page.click('button[aria-label="Dismiss"]');
      } catch (e) {
        // Button might not appear, safe to ignore
      }

      // Turn off microphone and camera before joining
      await this.page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        buttons.forEach((button) => {
          if (button.getAttribute('aria-label')?.includes('microphone')) {
            button.click();
          }
          if (button.getAttribute('aria-label')?.includes('camera')) {
            button.click();
          }
        });
      });

      // Click "Join now" button
      await this.page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const joinButton = buttons.find(button => 
          button.textContent?.includes('Join now') || 
          button.getAttribute('aria-label')?.includes('Join now')
        );
        if (joinButton) joinButton.click();
      });

      // Update session status
      await Session.findByIdAndUpdate(session._id, {
        'automation.meetStarted': true,
        status: 'active'
      });

      // Start monitoring participants
      this.monitorParticipants(session);

    } catch (error) {
      console.error('Failed to join meet:', error);
      await Session.findByIdAndUpdate(session._id, {
        'automation.lastError': `Failed to join meet: ${error.message}`,
        'automation.retryCount': session.automation.retryCount + 1
      });
      throw error;
    }
  }

  private async monitorParticipants(session: any) {
    if (!this.page) return;

    try {
      // Set up interval to check for admission requests
      setInterval(async () => {
        try {
          // Check for "Admit" buttons
          const admitButtons = await this.page!.$$('button[aria-label*="Admit"]');
          
          for (const button of admitButtons) {
            // Get the name/email of the participant (if available)
            const participantInfo = await button.$eval('div', 
              (el) => el.textContent || 'Unknown'
            );

            // Check if participant is in the allowed list
            const isAllowed = [
              ...session.participants.tutors,
              ...session.participants.students
            ].some(email => 
              participantInfo.toLowerCase().includes(email.toLowerCase())
            );

            if (isAllowed) {
              await button.click();
              
              // Update attendance
              await Session.findByIdAndUpdate(session._id, {
                [`attendance.${participantInfo}`]: {
                  joinTime: new Date()
                }
              });
            }
          }
        } catch (error) {
          console.error('Error in participant monitoring:', error);
        }
      }, 5000); // Check every 5 seconds

    } catch (error) {
      console.error('Failed to set up participant monitoring:', error);
    }
  }

  async startRecording(session: any) {
    try {
      if (!this.page) throw new Error('Browser not initialized');

      // Click on more options (three dots)
      await this.page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const moreButton = buttons.find(button => 
          button.getAttribute('aria-label')?.includes('More options')
        );
        if (moreButton) moreButton.click();
      });

      // Wait for and click "Record meeting" option
      await this.page.evaluate(() => {
        const menuItems = Array.from(document.querySelectorAll('[role="menuitem"]'));
        const recordButton = menuItems.find(item => 
          item.textContent?.includes('Record meeting')
        );
        if (recordButton) (recordButton as HTMLElement).click();
      });

      // Update session status
      await Session.findByIdAndUpdate(session._id, {
        'automation.recordingStarted': true
      });

    } catch (error) {
      console.error('Failed to start recording:', error);
      await Session.findByIdAndUpdate(session._id, {
        'automation.lastError': `Failed to start recording: ${error.message}`
      });
      throw error;
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }
}

export const meetAutomation = new MeetAutomation();
