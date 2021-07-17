const functions = require('firebase-functions');

exports.chatMessagetOnWriteEven = functions
.firestore.document("CONVERSATIONS/{conversationId}/MESSAGES/{messageId}")
.onWrite((change, context) => {
    if (change.before.exists && change.after.exists) {
        // update event
        console.log("********* UPDATE *****************")
        let docRef = change.after.ref
        let path = docRef.path

        const dataAfterChanges = change.after.data()

    } else if (!change.after.exists) {
        //delete event
        console.log("********* DELETE *****************")
        let docRef = change.before.ref
        let path = docRef.path

    } else {
        //add event
        console.log("********* CREATE *****************")
        let docRef = change.after.ref
        let path = docRef.path
        let requestId = docRef.id
        let data = change.after.data()

        sendChatNotificationMessage(data)
    }

});

function sendChatNotificationMessage(data){

    let notificationKey = data.idTo;
    console.log('notification key = '+notificationKey); 
    
    const payload = {
        data:{
          type:'CHAT_MESSAGE',
          body:"Message recu",
          contentMessage: data.content,
          from: data.idFrom
      }
    };

    console.log('Notification key'+notificationKey);  
    console.log(payload); 
    if (notificationKey) {   
        console.log('Notification key ok befor to send: payload ${payload}');  
    return admin.messaging().sendToTopic(notificationKey, payload);
        
   }

}