import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import {Platform} from 'react-native';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export class NotificationService {
  private static navigationRef: any = null;

  static async initialize(navigationRef?: any): Promise<void> {
    this.navigationRef = navigationRef;
    
    try {
      await this.registerForPushNotificationsAsync();
      this.setupNotificationListeners();
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  }

  private static async registerForPushNotificationsAsync(): Promise<void> {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('mood-reminders', {
        name: 'Mood Reminders',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'default', // Use system default sound
        enableVibrate: true,
        bypassDnd: false,
        showBadge: true,
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.warn('Permission not granted for notifications');
        return;
      }
      
      try {
        const projectId = Constants.expoConfig?.extra?.eas?.projectId || 
                         Constants.easConfig?.projectId;
        
        token = await Notifications.getExpoPushTokenAsync({
          projectId,
        });
        
        console.log('Push token:', token);
      } catch (error) {
        console.warn('Failed to get push token:', error);
      }
    } else {
      console.warn('Must use physical device for push notifications');
    }
  }

  private static setupNotificationListeners(): void {
    // Listen for notification received while app is in foreground
    Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
    });

    // Listen for notification response (when user taps notification)
    Notifications.addNotificationResponseReceivedListener((response) => {
      const { actionIdentifier, notification } = response;
      const { data } = notification.request.content;
      
      console.log('Notification tapped:', { actionIdentifier, data });
      
      if (data?.type === 'mood_reminder' && this.navigationRef?.current) {
        // Add small delay to ensure navigation is ready
        setTimeout(() => {
          try {
            this.navigationRef.current.navigate('MoodRecording', {
              alarmId: data.alarmId,
              alarmName: data.alarmName,
              fromNotification: true,
              timestamp: new Date().toISOString(),
            });
            console.log('Navigated to MoodRecording with:', {
              alarmId: data.alarmId,
              alarmName: data.alarmName,
            });
          } catch (error) {
            console.error('Navigation error:', error);
            // Fallback to deep link
            this.handleDeepLink(data);
          }
        }, 100);
      }
    });
  }

  private static handleDeepLink(data: any): void {
    const url = `manifestexpo://mood-recording/${data.alarmId}?alarmName=${encodeURIComponent(data.alarmName || '')}`;
    
    Linking.openURL(url).catch((error: any) => {
      console.error('Deep link failed:', error);
    });
  }

  static async scheduleNotification(
    title: string,
    body: string,
    data: any,
    trigger: Date | number
  ): Promise<string> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
        },
        trigger: trigger instanceof Date ? { date: trigger } : { seconds: trigger },
      });
      
      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      throw error;
    }
  }

  static async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error canceling notification:', error);
      throw error;
    }
  }

  static async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
      throw error;
    }
  }

  static async getAllScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  static async scheduleAlarmNotification(
    alarmId: string,
    alarmName: string,
    triggerDate: Date,
    soundType: string = 'default'
  ): Promise<string> {
    const title = 'Mood Check-In';
    const body = `Time for your ${alarmName} mood check-in!`;
    const data = {
      type: 'mood_reminder',
      alarmId,
      alarmName,
    };

    // Map custom sound types to actual sound files or system sounds
    const getSoundForType = (type: string) => {
      switch (type) {
        case 'ambient-piano':
          return 'ambient_piano.mp3';
        case 'singing-bowl':
          return 'singing_bowl.mp3';
        case 'singing-bowl-hit':
          return 'singing_bowl_hit.mp3';
        case 'tibetan-bowl-low':
          return 'tibetan_bowl_low.mp3';
        case 'calm-music':
          return 'calm_music.mp3';
        case 'relaxing-guitar':
          return 'relaxing_guitar.mp3';
        default:
          return 'default';
      }
    };

    try {
      // Ensure the trigger date has seconds set to 0 for precise timing
      const preciseTriggerDate = new Date(triggerDate);
      preciseTriggerDate.setSeconds(0, 0);
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default', // Use 'default' for system sound
          priority: Notifications.AndroidNotificationPriority.MAX,
          vibrate: [0, 250, 250, 250],
        },
        trigger: { 
          date: preciseTriggerDate,
          channelId: 'mood-reminders', // Explicitly set channel
        },
      });
      
      return notificationId;
    } catch (error) {
      console.error('Error scheduling alarm notification:', error);
      throw error;
    }
  }

  static async getBadgeCountAsync(): Promise<number> {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      console.error('Error getting badge count:', error);
      return 0;
    }
  }

  static async setBadgeCountAsync(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Error setting badge count:', error);
    }
  }
}