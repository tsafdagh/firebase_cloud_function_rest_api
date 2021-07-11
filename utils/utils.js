exports.addDaysToDate = function (date, days) {

    var result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;   
}

exports.addYearToDate = function (date, nbOfYear) {
    var result = new Date(date);
    result.setDate(result.getFullYear() + nbOfYear);
    return result;   
}

exports.addMonthToDate = function (date, nbOfMonth) {
    var result = new Date(date);
    result.setDate(result.getMonth() + nbOfMonth);
    return result;   
}

exports.randomId = function(idLength) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < idLength; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
   }
   return result;
}

exports.randomUID =function() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
