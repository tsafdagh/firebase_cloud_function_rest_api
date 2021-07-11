const functions = require('firebase-functions');
const admin  = require('firebase-admin');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions

const firebaseProjectId = process.env.FIREBASE_CONFIG;
if(firebaseProjectId ==="danaidapp"){

  DATABASE_URL ="https://danaidapp.firebaseio.com";

}else if(firebaseProjectId ==="danaid-dev"){
  DATABASE_URL ="https://danaid-dev.firebaseio.com";
}

//admin.initializeApp();
admin.initializeApp(functions.config().firebase);

const db = admin.firestore();


exports.facturationtrigger = require('./triggers/facturationTriggers');

exports.appointmentTrigger = require('./triggers/notificationTriggers/appointmentNotifications');

exports.chatMessageTrigger = require("./triggers/notificationTriggers/chatMessageNotifications");


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

            // si il n'exite pas dans cette collection, c'est qu'il n'a pas creer son compte via lien d'invitation
            // on vérifie si le paiement a été effectuer et on active ses cartes
            var facturationValider = snap.data().etatValider;
            if(facturationValider){
              var dateFinvalidite = snap.data().dateFinCouvertureAdherent;
              return enableAdherentCartAndBeneficiaireCart(userId, dateFinvalidite);
            }else{ return true; }

          } else {

            // Dans ce cas de figure le compte a été creer via un lien d'invitation
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
                    var dateFinvalidite = snap.data().dateFinCouvertureAdherent;
                    return enableAdherentCartAndBeneficiaireCart(userId, dateFinvalidite);
                }).catch(err => {
                  console.log(err)
                  return false
                });
            }else{
              // si le paiement n'a pas été éffectué, on ne fait rein du tout
              console.log("paiement non éffectuer!! ");
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
             // si il n'exite pas dans cette collection, c'est qu'il n'a pas creer son compte via lien d'invitation
            // on vérifie si le paiement a été effectuer et on active ses cartes
            var facturationValider = change.after.data().etatValider;
            if(facturationValider){
              var dateFinvalidite = change.after.data().dateFinCouvertureAdherent;
              return enableAdherentCartAndBeneficiaireCart(userId, dateFinvalidite);
            }else{ return true; }
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
                  var dateFinvalidite = change.after.data().dateFinCouvertureAdherent;
                  return enableAdherentCartAndBeneficiaireCart(userId, dateFinvalidite);
                }).catch(err => {
                  console.log(err)
                  return false
                });
            }else{
              // si le paiement n'a pas été éffectué, on ne fait rein du tout
              console.log("Paiement non activé ");
            }

          }
          return true
      }).catch(err => {
        console.log(err)
        return false
      } );
   });

   /** Cette fonction a pour rôle d'activer la carte 
    * de l'adherent et de déclancher l'activation de celle
    * de ses beneficiaires
    */
   function enableAdherentCartAndBeneficiaireCart(adherentId, newdateFinValidite){
     return db.collection("ADHERENTS")
     .doc(adherentId)
     .update({
      profilEnabled: true,
      datFinvalidite: newdateFinValidite
     })
     .then(()=> {
         console.log("Account of adherent "+adherentId+" are successfully enabled!");
         return enableBeneficiaireCarts(adherentId, newdateFinValidite)
     })
     .catch(err =>  {
         // The document probably doesn't exist.
         console.error("Error to enable account of adherent "+adherentId+" !"+err);
         return true
     });
   }

   /** 
    * Cette fonction a pour rôle d'activer toutes 
    * les carte des bénéficires d'un adherent
    * **/
   function enableBeneficiaireCarts(adherentId, newdateFinValidite){
     return  db.collection("ADHERENTS")
     .doc(adherentId)
     .collection("BENEFICIAIRES")
     .get()
     .then(querySnapshot =>{
      return querySnapshot.forEach(doc => {

      db.collection("ADHERENTS")
      .doc(adherentId)
      .collection("BENEFICIAIRES")
      .doc(doc.id)
      .update({
        enabled: true,
        dateFinValidite: newdateFinValidite
      })
      .then(()=> {
        console.log("beneficiaire id: "+doc.id+" from adherent "+adherentId+" are successfully enabled!");
        return true
      }).catch(err => {
        console.log("beneficiaire id: "+doc.id+" from adherent "+adherentId+" Are not enabled! "+err);
        return false
      });

    })
 }).catch(err => {
  console.log(err)
  return false
})

}

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
