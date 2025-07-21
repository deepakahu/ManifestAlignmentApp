import * as Notifications from 'expo-notifications';
import { Platform, Alert } from 'react-native';
import * as Device from 'expo-device';

// Configure notification handler to show alerts even when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: Notifications.AndroidNotificationPriority.MAX,
  }),
});

export class AlarmNotificationService {
  static isInitialized = false;
  static navigationRef: any = null;

  /**
   * Initialize the alarm notification service
   */
  static async initialize(navigationRef?: any) {
    if (this.isInitialized) return;
    
    this.navigationRef = navigationRef;
    
    try {
      // Configure alarm channel first
      await this.configureAlarmChannel();
      
      // Request permissions
      const hasPermission = await this.requestNotificationPermissions();
      if (!hasPermission) {
        console.warn('Notification permissions not granted');
        return false;
      }
      
      // Setup notification listeners
      this.setupNotificationListeners();
      
      this.isInitialized = true;
      console.log('AlarmNotificationService initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize AlarmNotificationService:', error);
      return false;
    }
  }

  /**
   * Request notification permissions (especially for Android 13+)
   */
  static async requestNotificationPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
            allowAnnouncements: true,
            allowCriticalAlerts: false, // Would need special entitlement
          },
          android: {},
        });
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to use alarms.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Notifications.openSettingsAsync() }
          ]
        );
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  /**
   * Configure high-priority alarm notification channel for Android
   */
  static async configureAlarmChannel(): Promise<void> {
    if (Platform.OS === 'android') {
      // Delete existing channel to ensure fresh configuration
      await Notifications.deleteNotificationChannelAsync('alarm_channel');
      
      // Create new alarm channel with maximum priority
      await Notifications.setNotificationChannelAsync('alarm_channel', {
        name: 'Alarm Notifications',
        importance: Notifications.AndroidImportance.MAX, // Maximum importance for alarms
        sound: 'default', // Will be overridden by custom sounds if specified
        vibrationPattern: [0, 500, 250, 500, 250, 500], // Strong vibration pattern
        lightColor: '#FF0000', // Red LED light
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC, // Show on lock screen
        bypassDnd: true, // CRITICAL: Bypass Do Not Disturb for alarms
        enableVibrate: true,
        enableLights: true,
        showBadge: true,
        description: 'High-priority notifications for alarms that need immediate attention',
      });
      
      console.log('Alarm channel configured successfully');
    }
  }

  /**
   * Schedule an alarm notification
   */
  static async scheduleAlarmNotification(
    alarmId: string,
    title: string,
    body: string,
    triggerDate: Date,
    soundType: string = 'default',
    data: any = {}
  ): Promise<string | null> {
    try {
      // Ensure permissions
      const hasPermission = await this.requestNotificationPermissions();
      if (!hasPermission) {
        throw new Error('Notification permissions not granted');
      }

      // Map custom sound types to file names
      const getSoundFile = (type: string) => {
        const soundMap: Record<string, string> = {
          'ambient-piano': Platform.OS === 'ios' ? 'Ambient Piano.mp3' : 'ambient_piano',
          'singing-bowl': Platform.OS === 'ios' ? 'Singing Bowl.mp3' : 'singing_bowl',
          'singing-bowl-hit': Platform.OS === 'ios' ? 'Singing Bowl Hit.mp3' : 'singing_bowl_hit',
          'tibetan-bowl-low': Platform.OS === 'ios' ? 'Tibetan Bowl Low.mp3' : 'tibetan_bowl_low',
          'calm-music': Platform.OS === 'ios' ? 'Calm Music.mp3' : 'calm_music',
          'relaxing-guitar': Platform.OS === 'ios' ? 'Relaxing Guitar.mp3' : 'relaxing_guitar',
        };
        return soundMap[type] || 'default';
      };

      const sound = getSoundFile(soundType);

      // Prepare notification content
      const notificationContent: Notifications.NotificationContentInput = {
        title,
        body,
        sound,
        priority: Notifications.AndroidNotificationPriority.MAX,
        categoryIdentifier: Notifications.NotificationCategory.ALARM,
        data: {
          ...data,
          alarmId,
          type: 'alarm',
          screen: 'alarm_ringing_screen',
        },
      };

      // Android-specific properties
      if (Platform.OS === 'android') {
        notificationContent.vibrate = [0, 500, 250, 500, 250, 500];
        notificationContent.color = '#FF0000';
        notificationContent.sticky = true; // Make notification harder to dismiss
      }

      // iOS-specific properties
      if (Platform.OS === 'ios') {
        notificationContent.badge = 1;
        notificationContent.interruptionLevel = 'timeSensitive'; // iOS 15+
      }

      // Schedule the notification
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: notificationContent,
        trigger: {
          date: triggerDate,
          channelId: Platform.OS === 'android' ? 'alarm_channel' : undefined,
        },
      });

      console.log(`Alarm scheduled: ${title} at ${triggerDate.toLocaleString()}`);
      return notificationId;

    } catch (error) {
      console.error('Failed to schedule alarm notification:', error);
      return null;
    }
  }

  /**
   * Setup notification response listeners
   */
  static setupNotificationListeners(): void {
    // Handle notification received while app is foregrounded
    Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received in foreground:', notification);
      
      const { data } = notification.request.content;
      if (data?.type === 'alarm') {
        // Could trigger an in-app alarm UI here
        this.handleAlarmTriggered(data);
      }
    });

    // Handle notification response (user tapped notification)
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification response:', response);
      
      const { data } = response.notification.request.content;
      if (data?.screen === 'alarm_ringing_screen' && this.navigationRef?.current) {
        // Navigate to alarm ringing screen
        setTimeout(() => {
          try {
            this.navigationRef.current.navigate('AlarmRinging', {
              alarmId: data.alarmId,
              alarmName: data.alarmName || 'Alarm',
              fromNotification: true,
            });
          } catch (error) {
            console.error('Navigation failed:', error);
            // Fallback: show an alert
            Alert.alert('Alarm!', 'Your alarm is ringing!');
          }
        }, 100);
      }
    });
  }

  /**
   * Handle alarm triggered event
   */
  static handleAlarmTriggered(data: any): void {
    // This is called when an alarm notification is received while app is in foreground
    if (this.navigationRef?.current) {
      try {
        this.navigationRef.current.navigate('AlarmRinging', {
          alarmId: data.alarmId,
          alarmName: data.alarmName || 'Alarm',
          fromNotification: true,
        });
      } catch (error) {
        // If navigation fails, show an alert
        Alert.alert(
          '⏰ Alarm!',
          data.alarmName || 'Your alarm is ringing!',
          [
            { text: 'Dismiss', style: 'cancel' },
            { text: 'Open', onPress: () => {
              // Try navigation again or handle differently
            }}
          ]
        );
      }
    }
  }

  /**
   * Cancel a scheduled alarm notification
   */
  static async cancelAlarmNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log(`Alarm notification cancelled: ${notificationId}`);
    } catch (error) {
      console.error('Failed to cancel alarm notification:', error);
    }
  }

  /**
   * Get all scheduled alarm notifications
   */
  static async getScheduledAlarmNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      const allNotifications = await Notifications.getAllScheduledNotificationsAsync();
      return allNotifications.filter(n => n.content.data?.type === 'alarm');
    } catch (error) {
      console.error('Failed to get scheduled alarms:', error);
      return [];
    }
  }

  /**
   * Test alarm notification immediately
   */
  static async testAlarmNotification(): Promise<void> {
    console.log('Testing alarm notification in 5 seconds...');
    
    const triggerDate = new Date(Date.now() + 5000); // 5 seconds from now
    
    const notificationId = await this.scheduleAlarmNotification(
      'test-alarm',
      '⏰ Test Alarm!',
      'This is a test alarm notification',
      triggerDate,
      'default',
      { test: true }
    );
    
    if (notificationId) {
      console.log(`Test alarm scheduled with ID: ${notificationId}`);
    } else {
      console.error('Failed to schedule test alarm');
    }
  }

  /**
   * Check if all required permissions are granted
   */
  static async checkAlarmPermissions(): Promise<{
    notifications: boolean;
    exactAlarm?: boolean;
    fullScreen?: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];
    
    // Check notification permission
    const { status } = await Notifications.getPermissionsAsync();
    const notificationsGranted = status === 'granted';
    
    if (!notificationsGranted) {
      issues.push('Notification permission not granted');
    }
    
    // Check if device is physical (not emulator)
    if (!Device.isDevice) {
      issues.push('Running on emulator - some alarm features may not work properly');
    }
    
    // Platform-specific checks
    if (Platform.OS === 'android') {
      // Check if alarm channel exists
      const channels = await Notifications.getNotificationChannelsAsync();
      const alarmChannel = channels.find(c => c.id === 'alarm_channel');
      
      if (!alarmChannel) {
        issues.push('Alarm notification channel not configured');
      } else if (alarmChannel.importance < Notifications.AndroidImportance.HIGH) {
        issues.push('Alarm channel importance is too low');
      }
      
      // Note: We can't directly check SCHEDULE_EXACT_ALARM permission from JS
      // but we've added it to the manifest
    }
    
    return {
      notifications: notificationsGranted,
      issues,
    };
  }
}