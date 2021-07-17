const functions = require('firebase-functions');

exports.appointmenttOnWriteEven = functions
.firestore.document("APPOINTMENTS/{appointmentId}")
.onWrite((change, context) => {
    if (change.before.exists && change.after.exists) {
        // update event
        console.log("********* UPDATE *****************")
        let docRef = change.after.ref
        let path = docRef.path

        const dataAfterChanges = change.after.data()
        if(dataAfterChanges.status === 1){
            //Le medecin valide le rendez-vous

            sendAppointmentValidationMessage(dataAfterChanges)
        }else if(dataAfterChanges.status === 1){
            //Le medecin rejette le rendez-vous
            sendAppointmentCanceledMessage(dataAfterChanges)
        }

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
    }

});

function sendAppointmentValidationMessage(dataAfterChanges){
    const notificationKey = dataAfterChanges.adherentId.substring(1); //remove + into adherent phone number

    console.log('notification key = '+notificationKey); 
    
    const payload = {
        data:{
          type:'CONSULTATION',
          status: '1',
          body:"Consultation validé",
          doctorId: dataAfterChanges.doctorId //Id du medecin qui a valider la consultation
      }
    };

    console.log('Notification key'+notificationKey);  
    console.log(payload); 
    if (notificationKey) {   
        console.log('Notification key ok befor to send: payload ${payload}');  
    return admin.messaging().sendToTopic(notificationKey, payload) 
        
   }

}

function sendAppointmentCanceledMessage(dataAfterChanges){
    const notificationKey = dataAfterChanges.adherentId.substring(1); //remove + into adherent phone number

    console.log('notification key = '+notificationKey); 
    
    const payload = {
        data:{
          type:'CONSULTATION',
          status: '2',
          body:"Consultation rejetée",
          doctorId: dataAfterChanges.doctorId //Id du medecin qui a rejeter la consultation
      }
    };

    console.log('Notification key'+notificationKey);  
    console.log(payload); 
    if (notificationKey) {   
        console.log('Notification key ok befor to send: payload ${payload}');  
    return admin.messaging().sendToTopic(notificationKey, payload) 
        
   }
}