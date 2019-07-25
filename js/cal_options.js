$(window).load(function(){
    if(localStorage.getItem("calFixIntrinsic")=="true"){
        $("#calOpFixIntrinsicCheck").prop( "checked", true );
    }else{
        $("#calOpFixIntrinsicCheck").prop( "checked", false );
    }
    if(localStorage.getItem("calUseIntrinsic")=="true"){
        $("#calOpUseIntrinsicCheck").prop( "checked", true );
    }else{
        $("#calOpUseIntrinsicCheck").prop( "checked", false );
    }
    if(localStorage.getItem("calUseExtrinsic")=="true"){
        $("#calOpUseExtrinsicCheck").prop( "checked", true );
    }else{
        $("#calOpUseExtrinsicCheck").prop( "checked", false );
    }
    if(localStorage.getItem("calFixPrincipal")=="true"){
        $("#calOpFixPrincipalCheck").prop( "checked", true );
    }else{
        $("#calOpFixPrincipalCheck").prop( "checked", false );
    }
    if(localStorage.getItem("calFixAspect")=="true"){
        $("#calOpFixAspectCheck").prop( "checked", true );
    }else{
        $("#calOpFixAspectCheck").prop( "checked", false );
    }
    if(localStorage.getItem("calSameFocalLength")=="true"){
        $("#calOpSameFocalCheck").prop( "checked", true );
    }else{
        $("#calOpCheckSameFocal").prop( "checked", false );
    }
    if(localStorage.getItem("calZeroTangentDist")=="true"){
        $("#calOpZeroTangentCheck").prop( "checked", true );
    }else{
        $("#calOpZeroTangentCheck").prop( "checked", false );
    }
    if(localStorage.getItem("calFixK1")=="true"){
        $("#calOpFixK1Check").prop( "checked", true );
    }else{
        $("#calOpFixK1Check").prop( "checked", false );
    }
    if(localStorage.getItem("calFixK2")=="true"){
        $("#calOpFixK2Check").prop( "checked", true );
    }else{
        $("#calOpFixK2Check").prop( "checked", false );
    }
    if(localStorage.getItem("calFixK3")=="true"){
        $("#calOpFixK3Check").prop( "checked", true );
    }else{
        $("#calOpFixK3Check").prop( "checked", false );
    }
});



$("#calOptionsDefaultsButton").on('click',function(){
    $("#calOpFixIntrinsicCheck").prop( "checked", false );
    $("#calOpUseIntrinsicCheck").prop( "checked", true );
    $("#calOpUseExtrinsicCheck").prop( "checked", false );
    $("#calOpFixPrincipalCheck").prop( "checked", false );
    $("#calOpFixAspectCheck").prop( "checked", false );
    $("#calOpSameFocalCheck").prop( "checked", false );
    $("#calOpZeroTangentCheck").prop( "checked", true );
    $("#calOpFixK1Check").prop( "checked", false );
    $("#calOpFixK2Check").prop( "checked", false );
    $("#calOpFixK3Check").prop( "checked", false );
});


$("#calOptionsApplyButton").on('click',function(){
    calFixIntrinsic = "false";
    calUseIntrinsic = "true";
    calUseExtrinsic = "false";
    calFixPrincipal = "false";
    calFixAspect = "false";
    calSameFocalLength = "false";
    calZeroTangentDist = "true";
    calFixK1 ="false";
    calFixK2 = "false";
    calFixK3 = "false";
    if($("#calOpFixIntrinsicCheck")[0].checked){
        localStorage.setItem("calFixIntrinsic","true");
    }else{
        localStorage.setItem("calFixIntrinsic","false");
    }
    if($("#calOpUseIntrinsicCheck")[0].checked){
        localStorage.setItem("calUseIntrinsic","true");
    }else{
        localStorage.setItem("calUseIntrinsic","false");
    }
    if($("#calOpUseExtrinsicCheck")[0].checked){
        localStorage.setItem("calUseExtrinsic","true");
    }else{
        localStorage.setItem("calUseExtrinsic","false");
    }
    if($("#calOpFixPrincipalCheck")[0].checked){
        localStorage.setItem("calFixPrincipal","true");
    }else{
        localStorage.setItem("calFixPrincipal","false");
    }
    if($("#calOpFixAspectCheck")[0].checked){
        localStorage.setItem("calFixAspect","true");
    }else{
        localStorage.setItem("calFixAspect","false");
    }
    if($("#calOpSameFocalCheck")[0].checked){
        localStorage.setItem("calSameFocalLength","true");
    }else{
        localStorage.setItem("calSameFocalLength","false");
    }
    if($("#calOpZeroTangentCheck")[0].checked){
        localStorage.setItem("calZeroTangentDist","true");
    }else{
        localStorage.setItem("calZeroTangentDist","false");
    }
    if($("#calOpFixK1Check")[0].checked){
        localStorage.setItem("calFixK1","true");
    }else{
        localStorage.setItem("calFixK1","false");
    }
    if($("#calOpFixK2Check")[0].checked){
        localStorage.setItem("calFixK2","true");
    }else{
        localStorage.setItem("calFixK2","false");
    }
    if($("#calOpFixK3Check")[0].checked){
        localStorage.setItem("calFixK3","true");
    }else{
        localStorage.setItem("calFixK3","false");
    }
    window.close();
});
