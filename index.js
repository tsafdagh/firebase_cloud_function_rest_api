const functions = require('firebase-functions');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

const admin = require('firebase-admin');
admin.initializeApp();


exports.getServerTime = functions.https.onCall((data,context)=>{
    console.log("new request to get server date name " +data.name);
    console.log("new request to get server date year " +data.year);

    return Date.now()
   /* return {
        firstNumber: firstNumber,
        secondNumber: secondNumber,
        operator: '+',
        operationResult: firstNumber + secondNumber,
      }
      */
    
    });


    exports.createNotificationForFacturation = functions.firestore
  .document('ADHERENTS/{userId}/NEW_FACTURATIONS_ADHERENT/{facturationId}')
  .onCreate((snap, context) => { 

     // Get an object representing the document
      // e.g. {'name': 'Marie', 'age': 66}
      const newValue = snap.data();

      // access to the userId
      var userId = snap.ref.parent.parent.id;

      console.log('UserId = '+userId); 

      notificationKey = userId.substring(1);
      console.log('notification key = '+notificationKey); 


      // access a particular field as you would any JS property
      const numeroTrimestre = newValue.numeroTrimestrielleFacture;
      const montant = newValue.montant

      //si le message ne viens pas de la dashborad on ne fais rien
      if(newValue.fromDashboard === false){
          return;
      }

      const payload = {
        data:{
          title:'Nouvelle facture disponible!',
          body:numeroTrimestre+"",
          montant:montant+" Fcfa"
        }
      }; 
    console.log('Notification key'+notificationKey);  
    console.log(payload); 
    if (notificationKey) {   
        console.log('Notification key ok befor to send: payload ${payload}');  
    return admin.messaging().sendToTopic(notificationKey, payload) 
        
   }

   });


    //Cette fonction a pour but de copier les beneficiaire d'une collection partager pour aller mettre chque beneficiaire
    //dans la collection BENEFICIAIRES de l'adherent qui l'a ajouter

   /* exports.deplacerBeneficiares = functions.firestore
    .document('ADHERENTS/{userId}')
    .onUpdate((change, context) => {

        const data = change.after.id
        // Step 1. Set main variable
        
        
        // Reference report in Firestore
        const db = admin.firestore()


        // Step 2. Query collection
        return db.collection('BENEFICIAIRES')
                 .get() 
                 .then(querySnapshot => {
                  
                    return querySnapshot.forEach(doc => {

                        db.collection("ADHERENTS")
                        .doc(doc.data().adherentId)
                        .collection("BENEFICIAIRES")
                        .doc(doc.data().matriculle)
                        .set(doc.data())
                        .then(function(docRef) {
                          console.log("Document successfully written!");
                          return true
                      }).catch(err => {
                        console.log(err)
                        return false
                      } );

                    })
                 })
                .catch(err => {
                  console.log(err)
                  return false
                } )

});

*/
