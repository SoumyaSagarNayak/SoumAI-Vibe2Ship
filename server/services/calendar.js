import { google } from 'googleapis';
import { dbService } from './firebase.js';

export const CalendarService = {
  async syncTask(userId, task) {
    const user = await dbService.getUser(userId);

    if (!user.googleAccessToken) {
      console.log(`[Calendar Sync] No Google access token found for user ${userId}. Skipping sync for task: ${task.title}`);
      return task; // No-op, return task unchanged
    }

    try {
      console.log(`[Calendar Sync] Initiating Google Calendar sync for task: ${task.title}`);
      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({ access_token: user.googleAccessToken });

      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      const startTime = new Date(task.deadline);
      // Fallback: If no valid deadline, skip.
      if (isNaN(startTime.getTime())) {
        console.warn(`[Calendar Sync] Task ${task.id} has invalid or no deadline. Cannot sync.`);
        return task;
      }

      // Calculate end time using estimated effort, fallback to 60 mins
      const effortMinutes = task.estimatedEffort || 60;
      const endTime = new Date(startTime.getTime() + (effortMinutes * 60000));

      const event = {
        summary: `[SOUM] ${task.title}`,
        description: task.description || 'Task synced from SOUM AI Companion',
        start: {
          dateTime: startTime.toISOString(),
          timeZone: 'UTC',
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: 'UTC',
        },
      };

      const response = await calendar.events.insert({
        calendarId: 'primary',
        resource: event,
      });

      console.log(`[Calendar Sync] Successfully synced task ${task.title}. Event ID: ${response.data.id}`);

      return {
        ...task,
        googleEventId: response.data.id,
        syncedToCalendar: true
      };
    } catch (error) {
      console.error(`[Calendar Sync Error] Failed to sync to Google Calendar:`, error.message);
      // Non-blocking error. Let the core flow continue even if sync fails
      return task;
    }
  }
};
