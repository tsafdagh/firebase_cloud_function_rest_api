const functions = require('firebase-functions');
const admin = require('firebase-admin');
const db = admin.firestore();
const utils = require('../utils/utils');


exports.obServeAdherentAccountOnWriteEven = functions
    .firestore.document("ADHERENTS/{adherentId}")
    .onWrite((change, context) => {
        if (change.before.exists && change.after.exists) {
            // update event
            console.log("********* UPDATE *****************")
            let docRef = change.after.ref
            let path = docRef.path

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

            let userProtectionLevel = data.userProtectionLevel
            
            if(userProtectionLevel !== 0){
                //Here we can generate thew annual facturation for the user
                 getProtectionLevelAndCreateAnnualfacturation(data, true)
            }

        }

    });


/*     function getProtectionLevelAndCreateAnnualfacturation(userData, isFirstInscription){


        console.log("********* getProtectionLevelAndCreateAnnualfacturation: protection level: "+userData.protectionLevel+"****************")
        console.log("********* getProtectionLevelAndCreateAnnualfacturation: matricule: "+userData.matricule+"****************")

        //get current protection level cost in configuration collection saved into the server
        let query = db.collection("SERVICES_LEVEL_CONFIGURATION").doc(""+userData.protectionLevel).get();
        query.then(doc => { 
    
            if(doc.exists){
                console.log("Document data:", doc.data());
                return createAnnualFacturation(userData,doc.data(), isFirstInscription);
            }else{
                console.log("No such facturation document!");
                return null;
            }
    
        }).catch(err => {
            console.log('Error getting data', err);
            throw new functions.https.HttpsError('Error getting document', err);
        });
    } */


    function getProtectionLevelAndCreateAnnualfacturation(userData, isFirstInscription){

        console.log("********* getProtectionLevelAndCreateAnnualfacturation: protection level: "+userData.protectionLevel+"****************")
        console.log("********* getProtectionLevelAndCreateAnnualfacturation: matricule: "+userData.matricule+"****************")

        //get current protection level cost in configuration collection saved into the server
        let query = db.collection("SERVICES_LEVEL_CONFIGURATION").where('numeroNiveau', '==', ""+userData.protectionLevel).get().limit(1);

        query.then(snapshot =>{
            if(!snapshot.empty){

                 snapshot.array.forEach(element => {
                    let facturationData = element.data();
                    console.log("****************facturation data:", facturationData);
                    return createAnnualFacturation(userData,facturationData, isFirstInscription);
                });
            }

            return null;
        }).catch(err => {
            console.log('Error getting data', err);
            throw new functions.https.HttpsError('Error getting document', err);
        });
    }


    function createAnnualFacturation(userData,levelDataCost, isFirstInscription){

        let dateNow= date.now();
        let datePaymentDelay = utils.addDays(dateNow, 15);//L'utilisateur a un delais de 15 jours pour payer sa facture
        let dateFinCouverture =  utils.addYearToDate(dateNow, 1); //la date de fin de couverture c'est un an apres la date de creation de la facture
    
        let intitulerRecu = "COTISATION"+utils.randomId(1)+ (new Date(dateNow).getFullYear());
    
    
        let receiptNumberInsc = (new Date(dateNow).getFullYear()) +'-' (new Date(dateNow).getMonth())+""+(new Date(dateNow).getDay())+""+(new Date(dateNow).getHours())+""+(new Date(dateNow).getSeconds())+""+ userData.userProtectionLevel;
    
        let annualCost = levelDataCost.cotisationMensuelleFondDSoint * 12
        let receiptNumber = (new Date(dateNow).getFullYear()) +'-' (new Date(dateNow).getMonth())+""+(new Date(dateNow).getDay())+""+(new Date(dateNow).getHours())+""+(new Date(dateNow).getMinutes())+""+ userData.userProtectionLevel;
     
        if(isFirstInscription){
    
            let inscriptFactUid = utils.randomUID();
    
            let inscriptionFacturationObj = {
                categoriePaiement: "INSCRIPTION",
                createdDate : date.now(),
                dateDelai: datePaymentDelay,
                etatValider:false,
                intitule: intitulerRecu,
                montant: levelDataCost.fraisIncription,
                numeroNiveau: userData.userProtectionLevel,
                numeroRecu: receiptNumberInsc,
                paid :false,
                paymentDate: null
            }
    
        //We save the new generated inscription facturation into the user subcollection
        db.collection("ADHERENTS")
        .doc(userData.authPhoneNumber)
        .collection("NEW_FACTURATIONS_ADHERENT")
        .doc(inscriptFactUid)
        .set(inscriptionFacturationObj);
    
    
        let annualFacturationObj = {
            categoriePaiement: "COTISATION_ANNUELLE",
                createdDate : date.now(),
                dateDebutCouvertureAdherent: dateNow,
                dateDelai: datePaymentDelay,
                dateFinCouvertureAdherent: dateFinCouverture,
                etatValider:false,
                inscriptionId: inscriptFactUid,
                intitule: intitulerRecu,
                montant: annualCost,
                numeroNiveau: userData.userProtectionLevel,
                numeroRecu: receiptNumber,
                paid :false,
                paymentDate: null
            }
    
    
             //We save the new generated annual facturation into the user subcollection
        db.collection("ADHERENTS")
        .doc(userData.authPhoneNumber)
        .collection("NEW_FACTURATIONS_ADHERENT")
        .doc()
        .set(annualFacturationObj)
    
        }else{
       
            //here we don't have the inscriptionId property, adn we don't create inscription facturation
            let annualFacturationObj = {
                categoriePaiement: "COTISATION_ANNUELLE",
                createdDate : date.now(),
                dateDebutCouvertureAdherent: dateNow,
                dateDelai: datePaymentDelay,
                dateFinCouvertureAdherent: dateFinCouverture,
                etatValider:false,
                intitule: intitulerRecu,
                montant: annualCost,
                numeroNiveau: userData.userProtectionLevel,
                numeroRecu: receiptNumber,
                paid :false,
                paymentDate: null
            }
       
        //We save the new generated facturation into the user subcollection
        db.collection("ADHERENTS")
        .doc(userData.authPhoneNumber)
        .collection("NEW_FACTURATIONS_ADHERENT")
        .doc()
        .set(annualFacturationObj);
        }
    
    }