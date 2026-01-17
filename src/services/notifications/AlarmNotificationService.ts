import * as Notifications from 'expo-notifications';
import notifee, { AndroidImportance, AndroidCategory, TriggerType, EventType } from '@notifee/react-native';
import { Platform, Alert, AppState } from 'react-native';
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
   * Uses @notifee for native AlarmManager support
   */
  static async configureAlarmChannel(): Promise<void> {
    if (Platform.OS === 'android') {
      try {
        // Create alarm channel with @notifee (uses native AlarmManager)
        const channelId = await notifee.createChannel({
          id: 'alarm_channel',
          name: 'Alarm Notifications',
          importance: AndroidImportance.HIGH, // High importance for alarms
          sound: 'default',
          vibration: true,
          vibrationPattern: [0, 500, 250, 500, 250, 500],
          lights: true,
          lightColor: '#FF0000',
          bypassDnd: true, // CRITICAL: Bypass Do Not Disturb
          description: 'High-priority notifications for alarms that need immediate attention',
        });
        
        console.log('✅ Alarm channel configured with @notifee:', channelId);
        
        // Also configure expo-notifications channel for compatibility
        try {
          await Notifications.deleteNotificationChannelAsync('alarm_channel');
          await Notifications.setNotificationChannelAsync('alarm_channel', {
            name: 'Alarm Notifications',
            importance: Notifications.AndroidImportance.MAX,
            sound: 'default',
            vibrationPattern: [0, 500, 250, 500, 250, 500],
            lightColor: '#FF0000',
            lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
            bypassDnd: true,
            enableVibrate: true,
            enableLights: true,
            showBadge: true,
            description: 'High-priority notifications for alarms that need immediate attention',
          });
        } catch (expoError) {
          console.warn('Could not configure expo-notifications channel:', expoError);
        }
      } catch (error) {
        console.error('❌ Failed to configure alarm channel:', error);
        throw error;
      }
    }
  }

  /**
   * Schedule an alarm notification using @notifee with native AlarmManager
   * This uses AlarmManager.setExactAndAllowWhileIdle() for reliable alarms
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
          'ambient-piano': Platform.OS === 'ios' ? 'ambient_piano.mp3' : 'ambient_piano',
          'singing-bowl': Platform.OS === 'ios' ? 'singing_bowl.mp3' : 'singing_bowl',
          'singing-bowl-hit': Platform.OS === 'ios' ? 'singing_bowl_hit.mp3' : 'singing_bowl_hit',
          'tibetan-bowl-low': Platform.OS === 'ios' ? 'tibetan_bowl_low.mp3' : 'tibetan_bowl_low',
          'calm-music': Platform.OS === 'ios' ? 'calm_music.mp3' : 'calm_music',
          'relaxing-guitar': Platform.OS === 'ios' ? 'relaxing_guitar.mp3' : 'relaxing_guitar',
        };
        return soundMap[type] || 'default';
      };

      const sound = getSoundFile(soundType);

      if (Platform.OS === 'android') {
        // Use @notifee with AlarmManager for Android (reliable alarms)
        const notificationId = await notifee.createTriggerNotification(
          {
            id: `${alarmId}-${triggerDate.getTime()}`,
            title,
            body,
            android: {
              channelId: 'alarm_channel',
              importance: AndroidImportance.HIGH,
              category: AndroidCategory.ALARM,
              sound: sound,
              vibrationPattern: [0, 500, 250, 500, 250, 500],
              color: '#FF0000',
              pressAction: {
                id: 'default',
                launchActivity: 'default',
              },
              fullScreenAction: {
                id: 'default',
              },
              // CRITICAL: Use AlarmManager for exact timing
              // This ensures alarms ring even when device is in Doze mode
              triggerAlarmManager: true, // Uses AlarmManager.setExactAndAllowWhileIdle()
            },
            data: {
              ...data,
              alarmId,
              type: 'alarm',
              screen: 'alarm_ringing_screen',
            },
          },
          {
            type: TriggerType.TIMESTAMP,
            timestamp: triggerDate.getTime(),
          }
        );

        console.log(`✅ Alarm scheduled with AlarmManager: ${title} at ${triggerDate.toLocaleString()}`);
        return notificationId;
      } else {
        // iOS: Use expo-notifications
        const notificationContent: Notifications.NotificationContentInput = {
          title,
          body,
          sound,
          priority: Notifications.AndroidNotificationPriority.MAX,
          categoryIdentifier: Notifications.NotificationCategory.ALARM,
          badge: 1,
          data: {
            ...data,
            alarmId,
            type: 'alarm',
            screen: 'alarm_ringing_screen',
          },
        };

        const notificationId = await Notifications.scheduleNotificationAsync({
          content: notificationContent,
          trigger: {
            date: triggerDate,
          },
        });

        console.log(`Alarm scheduled (iOS): ${title} at ${triggerDate.toLocaleString()}`);
        return notificationId;
      }
    } catch (error) {
      console.error('Failed to schedule alarm notification:', error);
      return null;
    }
  }

  /**
   * Setup notification response listeners
   * Handles both @notifee and expo-notifications events
   */
  static setupNotificationListeners(): void {
    // Handle @notifee events (Android alarms)
    if (Platform.OS === 'android') {
      notifee.onForegroundEvent(({ type, detail }) => {
        console.log('@notifee foreground event:', type, detail);
        
        if (type === EventType.PRESS || type === EventType.ACTION_PRESS) {
          const data = detail.notification?.data;
          if (data?.type === 'alarm' && this.navigationRef?.current) {
            this.navigateToAlarmScreen(data);
          }
        }
      });

      notifee.onBackgroundEvent(async ({ type, detail }) => {
        console.log('@notifee background event:', type, detail);
        
        if (type === EventType.PRESS || type === EventType.ACTION_PRESS) {
          const data = detail.notification?.data;
          if (data?.type === 'alarm') {
            // Handle background alarm trigger
            console.log('Alarm triggered in background:', data);
          }
        }
      });
    }

    // Handle expo-notifications events (iOS and fallback)
    Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received in foreground:', notification);
      
      const { data } = notification.request.content;
      if (data?.type === 'alarm') {
        this.handleAlarmTriggered(data);
      }
    });

    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification response:', response);
      
      const { data } = response.notification.request.content;
      if (data?.screen === 'alarm_ringing_screen' && this.navigationRef?.current) {
        this.navigateToAlarmScreen(data);
      }
    });
  }

  /**
   * Navigate to alarm ringing screen
   */
  private static navigateToAlarmScreen(data: any): void {
    if (!this.navigationRef?.current) return;
    
    setTimeout(() => {
      try {
        this.navigationRef.current.navigate('AlarmRinging', {
          alarmId: data.alarmId,
          alarmName: data.alarmName || 'Alarm',
          fromNotification: true,
        });
      } catch (error) {
        console.error('Navigation failed:', error);
        Alert.alert('Alarm!', 'Your alarm is ringing!');
      }
    }, 100);
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
   * Handles both @notifee and expo-notifications
   */
  static async cancelAlarmNotification(notificationId: string): Promise<void> {
    try {
      if (Platform.OS === 'android') {
        // Cancel @notifee notification
        await notifee.cancelNotification(notificationId);
      }
      // Also cancel expo-notification for compatibility
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log(`Alarm notification cancelled: ${notificationId}`);
    } catch (error) {
      console.error('Failed to cancel alarm notification:', error);
    }
  }

  /**
   * Get all scheduled alarm notifications
   * Returns both @notifee and expo-notifications alarms
   */
  static async getScheduledAlarmNotifications(): Promise<any[]> {
    try {
      const notifications: any[] = [];
      
      if (Platform.OS === 'android') {
        // Get @notifee scheduled notifications
        const notifeeNotifications = await notifee.getTriggerNotifications();
        notifications.push(...notifeeNotifications.filter(n => n.notification.data?.type === 'alarm'));
      }
      
      // Get expo-notifications scheduled notifications
      const expoNotifications = await Notifications.getAllScheduledNotificationsAsync();
      notifications.push(...expoNotifications.filter(n => n.content.data?.type === 'alarm'));
      
      return notifications;
    } catch (error) {
      console.error('Failed to get scheduled alarms:', error);
      return [];
    }
  }

  /**
   * Cancel all scheduled notifications (for alarm service use)
   * Cancels both @notifee and expo-notifications
   */
  static async cancelAllNotifications(): Promise<void> {
    try {
      if (Platform.OS === 'android') {
        // Cancel all @notifee notifications
        await notifee.cancelAllNotifications();
      }
      // Cancel all expo-notifications
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('✅ All notifications canceled');
    } catch (error) {
      console.error('❌ Failed to cancel all notifications:', error);
      throw error;
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