const { NotificationService } = require('./src/services/notifications/NotificationService');
const { AlarmService } = require('./src/services/AlarmService');

async function testAlarmNotification() {
  console.log('🔔 Testing Alarm Notification System...\n');
  
  try {
    // 1. Check notification permissions
    console.log('1️⃣ Checking notification permissions...');
    const { status } = await Notifications.getPermissionsAsync();
    console.log(`   Permission status: ${status}`);
    
    if (status !== 'granted') {
      console.log('   ❌ Notifications not granted. Please enable in settings.');
      return;
    }
    
    // 2. Schedule a test notification in 5 seconds
    console.log('\n2️⃣ Scheduling test notification in 5 seconds...');
    const testTime = new Date(Date.now() + 5000);
    
    const notificationId = await NotificationService.scheduleAlarmNotification(
      'test-alarm-id',
      'Test Alarm',
      testTime,
      'default' // Try default sound first
    );
    
    console.log(`   ✅ Notification scheduled with ID: ${notificationId}`);
    console.log(`   Trigger time: ${testTime.toLocaleString()}`);
    
    // 3. Verify notification is in the system
    console.log('\n3️⃣ Verifying notification in system...');
    const allNotifications = await NotificationService.getAllScheduledNotifications();
    const testNotification = allNotifications.find(n => n.identifier === notificationId);
    
    if (testNotification) {
      console.log('   ✅ Notification found in system');
      console.log('   Content:', JSON.stringify(testNotification.content, null, 2));
      console.log('   Trigger:', JSON.stringify(testNotification.trigger, null, 2));
    } else {
      console.log('   ❌ Notification NOT found in system!');
    }
    
    // 4. Test different sound types
    console.log('\n4️⃣ Testing different sound types...');
    const soundTypes = ['default', 'ambient-piano', 'singing-bowl'];
    
    for (let i = 0; i < soundTypes.length; i++) {
      const soundType = soundTypes[i];
      const triggerTime = new Date(Date.now() + (10 + i * 10) * 1000); // 10, 20, 30 seconds
      
      console.log(`   Testing ${soundType} sound...`);
      const id = await NotificationService.scheduleAlarmNotification(
        `test-${soundType}`,
        `Test ${soundType}`,
        triggerTime,
        soundType
      );
      console.log(`   ✅ Scheduled with ID: ${id} at ${triggerTime.toLocaleTimeString()}`);
    }
    
    // 5. Check all scheduled notifications
    console.log('\n5️⃣ All scheduled notifications:');
    const finalNotifications = await NotificationService.getAllScheduledNotifications();
    console.log(`   Total: ${finalNotifications.length}`);
    
    finalNotifications.forEach((n, index) => {
      const triggerTime = n.trigger?.date ? new Date(n.trigger.date) : 'Unknown';
      console.log(`   ${index + 1}. ${n.content.title} - ${triggerTime}`);
      console.log(`      Sound: ${n.content.sound}`);
    });
    
    console.log('\n✅ Test complete! Wait for notifications to trigger...');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Export for use in app
module.exports = { testAlarmNotification };