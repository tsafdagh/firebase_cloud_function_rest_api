const functions = require('firebase-functions');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore()

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


    /** 
     * Fonction utilisée pour les notifications
     */
  exports.createNotificationForFacturation = functions.firestore
  .document('ADHERENTS/{userId}/NEW_FACTURATIONS_ADHERENT/{facturationId}')
  .onCreate((snap, context) => { 

     // Get an object representing the document
      // e.g. {'name': 'Marie', 'age': 66}
      const newValue = snap.data();

      // access to the userId
      //var userId = snap.ref.parent.parent.id;
      var userId = snap.data().idAdherent;
      console.log('UserId = '+userId);

      notificationKey = userId.substring(1);
      console.log('notification key = '+notificationKey); 


      // access a particular field as you would any JS property
      const numeroTrimestre = newValue.numeroTrimestrielleFacture;
      const montant = newValue.montant

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


    /** 
     * Utiliser pour
     * comptabiliser les paiements éffectuer par les utilisateur 
     * qui ont créer leur compte par le biais d'un lien de partage
     */
  exports.manageAccountCreatedViaInvitationCreation = functions.firestore
  .document('ADHERENTS/{userId}/NEW_FACTURATIONS_ADHERENT/{facturationId}')
  .onCreate((snap, context) => { 

     // Get an object representing the document
      // e.g. {'name': 'Marie', 'age': 66}
      const newValue = snap.data();

      // access to the userId
      //var userId = snap.ref.parent.parent.id;
      var userId = snap.data().idAdherent;
      console.log('UserId = '+userId); 

      /* on vérifie si l'utilisateur a créer son compte à l'issue d'une invitation
      afin de mentionner que ce dernier a effectuer le paiement
       */
      return db.collection("COMPTES_CREER_VIA_INVITATION")
        .doc(userId)
        .get()
        .then(doc => {

          // l'utilisateur a un compte créer via invitation de lien dynamique, 
          if (!doc.exists) {
            console.log('No such document for update paiement');
            return true
          } else {
            console.log('Document data:', doc.data());


            var isFacturationValider = snap.data().etatValider
            if(isFacturationValider){//si le paiement a été effctué
                // on doit mentionner que ce dernier vient de faire un paiement
                var docInfo = db.collection("COMPTES_CREER_VIA_INVITATION")
                .doc(userId)

                var docMerge = docInfo.set({
                  firstPaiementProceded :true
                }, { merge: true}).then(function() {
                  console.log("Enregistrement du paiement éffectué avec succes...");
                  return true
                }).catch(err => {
                  console.log(err)
                  return false
                });
            }else{
              // si le paiement n'a pas été éffectué, on ne fait rein du tout
              console.log("Erreur d'enregistrement du paiement ");
            }

          }
          return true
      }).catch(err => {
        console.log(err)
        return false
      } );
   });

       /** 
     * Utiliser pour
     * comptabiliser les paiements éffectuer par les utilisateur 
     * qui ont créer leur compte par le biais d'un lien de partage
     */
  exports.manageAccountCreatedViaInvitationUpdate = functions.firestore
  .document('ADHERENTS/{userId}/NEW_FACTURATIONS_ADHERENT/{facturationId}')
  .onUpdate((change, context) => { 

     // Get an object representing the document
      // e.g. {'name': 'Marie', 'age': 66}
      const newValue = change.after.data();

      // access to the userId
      //var userId = snap.ref.parent.parent.id;
      var userId = newValue.idAdherent;
      console.log('UserId = '+userId); 

      /* on vérifie si l'utilisateur a créer son compte à l'issue d'une invitation
      afin de mentionner que ce dernier a effectuer le paiement
       */
      return db.collection("COMPTES_CREER_VIA_INVITATION")
        .doc(userId)
        .get()
        .then(doc => {

          // l'utilisateur a un compte créer via invitation de lien dynamique, 
          if (!doc.exists) {
            console.log('No such document!');
            return true
          } else {
            console.log('Document data:', doc.data());


            var isFacturationValider = newValue.etatValider
            if(isFacturationValider){//si le paiement a été effctué
                // on doit mentionner que ce dernier vient de faire un paiement
                var docInfo = db.collection("COMPTES_CREER_VIA_INVITATION")
                .doc(userId)

                var docMerge = docInfo.set({
                  firstPaiementProceded :true
                }, { merge: true}).then(function() {
                  console.log("Enregistrement du paiement éffectué avec succes...");
                  return true
                }).catch(err => {
                  console.log(err)
                  return false
                });
            }else{
              // si le paiement n'a pas été éffectué, on ne fait rein du tout
              console.log("Erreur d'enregistrement du paiement ");
            }

          }
          return true
      }).catch(err => {
        console.log(err)
        return false
      } );
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
