$.urlParam = function(name, defaults){
    var results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(window.location.href);
    if (!results)
    { 
        return defaults; 
    }
    return results[1] || defaults;
}