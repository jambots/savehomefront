var setupList=new Array("0-a", "0-d", "1-a", "1-d", "1-dc", "1-u", "10-a", "10-d", "10-u", "11-a", "11-u", "2-a", "3-a", "3-d", "3-u", "3-uc", "4-a", "4-d", "4-dc", "4-u", "5-a", "6-a", "6-d", "6-u", "6-uc", "7-a", "7-d", "7-dc", "7-u", "8-a", "9-a", "9-d", "9-u", "9-uc", "slide-down-hi", "slide-down-lo", "slide-up-hi", "slide-up-lo");

window.AudioContext = window.AudioContext || window.webkitAudioContext;
var audioContext;
var delay, feedbackGain, delayGain, masterGain;
var banks={"helms":{}, "triad":{}};
var buffersByUrl={};
var samples={};

var touchIdStack=new Array();
var touchesById=new Object();
var offset=101;
var channelsPerVoice=3;
var atVoice=0;
var maxVoice=8;

var channelMap=new Array();
function setupChannelMap(){
  var topObject=new Object();
  var bottomObject=new Object();

  for(c=0; c<setupList.length; c++){
    sound=setupList[c];
    topObject[sound]=24+c;
    bottomObject[sound]=24+c+setupList.length;
    //dbuga(sound+" "+topObject[sound]+" "+bottomObject[sound]+" | ");
    }
  channelMap.push(topObject);
  channelMap.push(bottomObject);
  }

function initAudio(){

    audioContext = new AudioContext();
    audioInited=true;
    delayInputGain = audioContext.createGain();// Gain 3
    delayInputGain.gain.value = 0.2;
    feedbackGain = audioContext.createGain();// Gain 5
    feedbackGain.gain.value = 0.33;
    masterGain = audioContext.createGain();// Gain 7
    masterGain.gain.value = 0.5;

    delay = audioContext.createDelay();
    delay.delayTime.value = 0.333;

    delayInputGain.connect(delay);
    delay.connect(feedbackGain);
    feedbackGain.connect(delay);
    delay.connect(masterGain);
    masterGain.connect(audioContext.destination);

  setupChannelMap();
  bufferSamples();
  //window.requestAnimationFrame(animTick);
}
function sustainKill(theChannel){
  lastSustainChannel=-1;
  //comQueue.push("action=manageSound|channel="+theChannel+"|mode=stop|loop=false");
  comQueue.push({channel:theChannel, mode:"stop"});
  }
function attackKill(theChannel){
  //comQueue.push("action=manageSound|channel="+theChannel+"|mode=pause|loop=false");
  comQueue.push({channel:theChannel, mode:"stop"});
  }
var lastSustainChannel=-1;
function sustainTick(thisId){
  //console.log('sustainTick '+thisId);
  //console.log(touchesById);
  touchesById[thisId].sustaining=true;
  sustainSound=touchesById[thisId].sustainSound;
  touchesById[thisId].sustainChannel++;
  if(touchesById[thisId].sustainChannel>=offset+(channelsPerVoice*(touchesById[thisId].voice+1))){
    touchesById[thisId].sustainChannel=offset+(channelsPerVoice*touchesById[thisId].voice);
    }
  lastSustainChannel=touchesById[thisId].sustainChannel;
  //dbug("lastSustainChannel:"+lastSustainChannel);
  //dbug2("<br>"+thisId+" ss="+sustainSound+" sc="+thisTouch.sustainChannel);
  //dbug(touchesById[thisId].sustainChannel);
  comQueue.push({channel:touchesById[thisId].sustainChannel, mode:"play", sound:sustainSound});
  //comQueue.push("action=manageSound|channel="+touchesById[thisId].sustainChannel+"|file="+sustainSound+"|mode=play|loop=false");
  comTick();
  }

var comQueue=[];
var sources=[];
function comTick(){
  for (var c=0; c<comQueue.length; c++){
    //console.log(comQueue[c]);

    if(comQueue[c].mode=="play"){
      var sound={source:sourceBuffer(buffersByUrl[comQueue[c].sound]), channel:comQueue[c].channel};
      sources.push(sound);
      sound.source.start(0);
    }
    if((comQueue[c].mode=="slidepause2")||(comQueue[c].mode=="slidepause")||(comQueue[c].mode=="pause")||(comQueue[c].mode=="stop")){
      spliceList=[];
      for(var s=0; s<sources.length; s++){
        if(sources[s].channel==comQueue[c].channel){
          console.log(sources[s].source.playbackState===undefined);
          if((sources[s].source.playbackState>0)||(sources[s].source.playbackState===undefined)){
            sources[s].source.stop();
            sources[s].source.disconnect();
          }
        spliceList.unshift(s);
        }
      }
      for (var l=0; l<spliceList.length; l++){
          var trash=sources.splice(spliceList[l],1);
          trash.source=null;
          trash=null;
      }
    }
  }
  comQueue=[];
  //console.log(sources);
}
var slideQueue=[];
var slideX=0;
var slideY=0;
var slidePrevX=0;
var slidePrevY=0;
var slideSpeed=.02;
var slideProg=1;
function animTick(){
  if(helpUp==false){slideTick();}
  if(helpUp){helpTick();}
  window.requestAnimationFrame(animTick);
}

function slideTick(){

  if(ww>wh){
    var moveType="uh";
    if(slideQueue.length>0){
      console.log(slideQueue);
      var move=slideQueue[0];
      slideSpeed=move.speed;
      slideProg=0;
      slidePrevX=slideX;
      slidePrevY=slideY;
      slideX=move.x;
      slideY=move.y;
      if(move.type=="start"){
        document.getElementById('slideDiv').style.display="block";
      }
      if(move.type=="end"){
        document.getElementById('slideDiv').style.display="none";
      }
      moveType=moveType;
      // end of new command
      slideQueue=[];

    }
    if(moveType!="end"){
      slideProg+=slideSpeed;
      if(slideProg>1){slideProg=1;}
      var prog=slideProg;//(Math.cos(Math.PI*(1-slideProg)) + 1) / 2;
      //if((prog<1)&&(prog>0)){console.log(prog);}
      var dx=slideX-slidePrevX;
      var dy=slideY-slidePrevY;
      var useX=slidePrevX+dx*prog;
      var useY=slidePrevY+dy*prog;
      document.getElementById('slideDiv').style.width=grid*1+"px";
      document.getElementById('slideDiv').style.height=grid*2.5+"px";
      document.getElementById('slideDiv').style.top=topPad+grid*(4.5*useY+1)+"px";
      document.getElementById('slideDiv').style.left=leftPad+cellSize*(useX)+"px";
      document.getElementById('slideDiv').style.backgroundImage='linear-gradient(to right, '+stops+')';
    }
  }
}
var stops="rgb(215,215,215),rgb(77,77,77),rgb(120,120,120),rgb(126,126,126),rgb(132,132,132),rgb(143,143,143),rgb(230,230,230),rgb(155,155,155),rgb(126,126,126),rgb(138,138,138),rgb(154,154,154),rgb(161,161,161),rgb(175,175,175),rgb(204,204,204),rgb(254,254,254),rgb(255,255,255),rgb(255,255,255),rgb(255,255,255),rgb(255,255,255),rgb(255,255,255),rgb(255,255,255),rgb(192,192,192),rgb(170,170,170),rgb(147,147,147),rgb(115,115,115),rgb(97,97,97),rgb(88,88,88),rgb(101,101,101),rgb(106,106,106),rgb(127,127,127),rgb(129,129,129),rgb(132,132,132),rgb(146,146,146),rgb(220,220,220),rgb(253,253,253),rgb(255,255,255),rgb(255,255,255),rgb(255,255,255),rgb(255,255,255),rgb(255,255,255),rgb(255,255,255),rgb(255,255,255),rgb(254,254,254),rgb(131,131,131),rgb(186,186,186),rgb(226,226,226),rgb(165,165,165),rgb(143,143,143),rgb(118,118,118),rgb(92,92,92),rgb(121,121,121)";
var keySources=[];
var keySelection=-1;
var keyInterval;
var mode="play";
var loadList=[];
var startTime=0;
var keyArray=["C", "F", "Bb", "Eb", "Ab", "Db", "Gb", "B", "E", "A", "D", "G"];
var keySequence=["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
var keyName="A";
var keyNum=9;


var keySources=[];
var intervalSequence=[
  {interval:0, form:""},
  {interval:5, form:""},
  {interval:2, form:""},
  {interval:7, form:""},
  {interval:5, form:""},
  {interval:10, form:""},
  {interval:7, form:""},
  {interval:0, form:""},
  {interval:2, form:""},
  {interval:9, form:"m"},
  {interval:0, form:""},
  {interval:4, form:"m7"},
];
function keyTick(){
  var keyUrl="banks/triad_"+keyArray[keySelection]+"/0-s.mp3";
  //console.log(keyUrl);
  var sound=sourceBuffer(buffersByUrl[keyUrl]);
  keySources.push({source:sound});
  sound.start(0);
  drawKeys();
}
var audioInited=false;
function handleLandscapeEvent(e){
  if(audioInited==false){initAudio();}

  if(helpUp){
    handleHelpEvent(e)
  }else{
    handleSteelEvent(e)
  }
}
var buttoning=false;
var helpProg=0;
var helpAt=0;
var xing=false;
function handleHelpEvent(e){
  if(docking){
    buttoning=false;
    return false;
  }
  var inset=grid;
  console.log("help "+e.type);
  if(e.type=="touchstart"){
    var found="";
    var x=e.touches[0].pageX;
    var y=e.touches[0].pageY;
    if((x>ww-inset-grid)&&(y<inset+grid)){found="x";}
    if((x>ww-inset-grid*3)&&(y>wh-inset-grid)){
      if(helpAt<helpArray.length-1){
        found="next";
      }
      else{
        found="done";
      }
    }
    if(helpAt==helpArray.length-1){
      if((x>inset+grid*3)&&(x<ww-inset-grid*3)&&(y>wh-inset-grid)){
        found="donate";
      }
    }
    if((x<inset+grid*3)&&(y>wh-inset-grid)){
      if(helpAt>0){
        found="back";
      }
    }
    if(found != ""){buttoning=true;}
    if(found =="next"){
      startHelpProg=helpProg;
      dockProg=0;
      helpAt++;
      docking=true;
    }
    if(found =="x"){
      xing=true;
    }
    if(found =="done"){
      xing=true;
    }
    if(found=="donate"){cordova.InAppBrowser.open("https://savehomefront.org", "_system")
}
    if(found =="back"){
      startHelpProg=helpProg;
      dockProg=0;
      helpAt--;
      docking=true;
    }
    console.log(found);
  }
  if(e.type=="touchend"){
    buttoning=false;
    if(xing){
        helpProg=helpAt;
        helpUp=false;
        docking=false;
        dockProg=1;
        xing=false;
        document.getElementById('helpCanvas').style.display="none";
    }
  }
  console.log(buttoning);

}
function hamburger(){
  buttoning=true;
  helpProg=helpAt;
  helpUp=true;
  docking=false;
  dockProg=1;
  xing=false;
  document.getElementById('helpCanvas').style.display="block";

}
var dockProg=1;
var startHelpProg=0;
var docking=false;
function helpTick(){
  if(docking){
    dockProg+=.05;
    if(dockProg>1){dockProg=1; docking=false;}
    var easeProg=.5+Math.cos(pi-pi*dockProg)/2;
    var invProg=1-easeProg;
    helpProg=startHelpProg*invProg+helpAt*easeProg;

  }
  document.getElementById("helpCanvas").style.left="-"+helpProg*ww+"px";
}

function handleSteelEvent(e){

  //console.log("steel "+e.type+" "+helpUp);
  if((e.type=="touchstart")&&(e.touches.length==1)){
    if(e.touches[0].pageX>leftPad+grid*14.5){
      var fieldY=e.touches[0].pageY-topPad;
      var yGrid=grid*9/14;
      var y=Math.floor(fieldY/yGrid);
      if(y<2){
        hamburger();
        mode="hamburger";
      }else{
        mode="key";
        if(y>13){y=13;}
        keySelection=y-2;
        //console.log(mode+" "+keySelection);
        window.clearInterval(keyInterval);
        keyInterval=window.setInterval("keyTick()", 300);
        keyTick();
      }
    }else{mode="play";}
  }
  if((e.type=="touchend")&&(e.touches.length==0)){
    if(mode=="key"){
      window.clearInterval(keyInterval);
      mode="play";
      while(keySources.length>0){
        var trash=keySources.pop();
        trash.source.stop();
        trash.source=null;
        trash=null;
      } //end while
      if(loadList.length==0){
        bufferKey(keySelection);
      }
      keySelection=-1;
      drawKeys();
    }// end of mode key
  }// end of touch end
  if(mode=="key"){
    if(e.type=="touchmove"){
      var fieldY=e.touches[0].pageY-topPad;
      var yGrid=grid*9/14;
      var y=Math.floor(fieldY/yGrid);
      if(y<2){y=2;}
      if(y>13){y=13;}
      keySelection=y-2;
    }
  }
  //console.log("mode=" +mode+ " type="+e.type+"");
  if(mode=="play"){
    // not sure this would happen
    if((e.type=="touchstart")&&(e.touches.length==1)&&(lastSustainChannel>-1)){
      comQueue.push({channel:lastSustainChannel, mode:"stop"});
      //comQueue.push("action=manageSound|channel="+lastSustainChannel+"|mode=stop|loop=false");
    }
    var startedTouchIds=new Array();
    var endedTouchIds=new Array();
    var prevTouchIdStack=touchIdStack;
    var prevTouchIdGlom=touchIdStack.join('|');
    //dbuga("<br>e.touches.length:"+e.touches.length);

    var newTouchIdArray=new Array();
    for(tNum=0; tNum<e.touches.length; tNum++){
      var t=e.touches[tNum];
      //console.log('t.identifier '+t.identifier);
      newTouchIdArray.push(t.identifier);
      if(prevTouchIdGlom.indexOf(t.identifier)==-1){
        // so we don't overwrite extant touches
        touchesById[t.identifier]=e.touches[tNum];
      }
      else{
        //console.log("! "+t.pageX+" "+t.identifier);
        touchesById[t.identifier].pageX=t.pageX;// this was auto for touches
        touchesById[t.identifier].pageY=t.pageY;// this was auto for touches,
        //test that shim doesn't break
      }
    }
    var newTouchIdGlom=newTouchIdArray.join('|');
    touchIdStack=new Array();
    //restore extant Ids to stack
    for (n=0; n<prevTouchIdStack.length; n++){
      thisId=prevTouchIdStack[n];
      if(newTouchIdGlom.indexOf(thisId)>-1){
        // exists in new event
        touchIdStack.push(thisId);
      }
      else{
        endedTouchIds.push(thisId);
        // to be silenced
      }
    }
    //test for new touches in new event
    for (n=0; n<newTouchIdArray.length; n++){
      thisId=newTouchIdArray[n];
      if(prevTouchIdGlom.indexOf(thisId)==-1){
        touchIdStack.push(thisId);
        startedTouchIds.push(thisId);
        atVoice++;
        if(atVoice>maxVoice){atVoice=0;}
        touchesById[thisId].slideCount=0;
        touchesById[thisId].sliding=false;
        touchesById[thisId].voice=atVoice;
        touchesById[thisId].sustainChannel=offset+(channelsPerVoice*atVoice);
        touchesById[thisId].position=-1;
        touchesById[thisId].attackChannel=-1;
        touchesById[thisId].x=-1;
        touchesById[thisId].y=-1;
        touchesById[thisId].sustainSound="";
        touchesById[thisId].sustaining=false;
        var sustainInterval;
        touchesById[thisId].sustainInterval=sustainInterval;
      }
    }
    // kick off started touches with attack
    for (n=0; n<startedTouchIds.length; n++){
      thisId=startedTouchIds[n];
      thisTouch=touchesById[thisId];
      thisVoice=thisTouch.voice;
      thisX=Math.floor((thisTouch.pageX-leftPad)/cellSize);
      thisY=Math.floor((thisTouch.pageY-topPad)/(grid*9/2));
      //console.log(thisX+" "+thisY);
      if(thisX<0){thisX=0;}
      if(thisX>11){thisX=11;}
      if(thisY<0){thisY=0;}
      if(thisY>1){thisY=1;}
      if((thisX==2)||(thisX==5)||(thisX==8)){touchesById[thisId].chromatic=true;}
      else{touchesById[thisId].chromatic=false;}
      attackChannel=channelMap[thisY][thisX+"-a"];
      touchesById[thisId].attackChannel=attackChannel;
      touchesById[thisId].x=thisX;
      touchesById[thisId].y=thisY;
      if(n==0){
        slideQueue.unshift({type:"start", speed:1, x:thisX, y:thisY});
      }
      //comQueue.push("action=manageSound|channel="+attackChannel+"|mode=play|starttime=0|loop=false");
      //dbug2("<br><b>action=manageSound|channel="+attackChannel+"|mode=play|starttime=0|loop=false</b>");
      // to set sustainer intervals
      //if(thisY==0){sustainSound="hi_"+thisX+"_s";}
      //else{sustainSound="lo_"+thisX+"_s";}

      if(thisY==0){
        attackSound="banks/helms_"+keyName+"/"+thisX+"-a.mp3";
        sustainSound="banks/helms_"+keyName+"/"+thisX+"-s.mp3";
      }
      else{
        attackSound="banks/triad_"+keyName+"/"+thisX+"-a.mp3";
        sustainSound="banks/triad_"+keyName+"/"+thisX+"-s.mp3";
      }

      comQueue.push({channel:attackChannel, mode:"play", sound:attackSound});


      touchesById[thisId].sustainSound=sustainSound;
      touchesById[thisId].sustainInterval=setInterval("sustainTick("+thisId+");", 1000+rnd(200));
    }
    // silence ended touch attacks and or sustains
    for (n=0; n<endedTouchIds.length; n++){
      if(n==0){
        slideQueue.unshift({type:"end", speed:1, x:0, y:0});
      }
      thisId=endedTouchIds[n];
      thisTouch=touchesById[thisId];
      var attackChannel=thisTouch.attackChannel;
      var sustainChannel=thisTouch.sustainChannel;
      //console.log('sustainChannel: '+sustainChannel);
      comQueue.push({channel:attackChannel, mode:"pause"});
      comQueue.push({channel:sustainChannel, mode:"pause"});
      sustainChannel++;
      if(sustainChannel > offset+(channelsPerVoice*thisTouch.voice+2)){
        sustainChannel=offset+(channelsPerVoice*thisTouch.voice);
      }
      comQueue.push({channel:sustainChannel, mode:"stop"});
      sustainChannel++;
      if(sustainChannel > offset+(channelsPerVoice*thisTouch.voice+2)){
        sustainChannel=offset+(channelsPerVoice*thisTouch.voice);
      }
      comQueue.push({channel:sustainChannel, mode:"stop"});
      //comQueue.push("action=manageSound|channel="+sustainChannel+"|mode=stop|loop=false");

      //dbug2("<br>action=manageSound|channel="+attackChannel+"|mode=pause|loop=false");
      comQueue.push({channel:sustainChannel, mode:"stop"});
      if(thisTouch.sliding){
            touchesById[thisId].sliding=false;
            useChannel=channelMap[thisY][touchesById[thisId].slideSample];
            comQueue.push({channel:useChannel, mode:"slidepause2"});

      }
      comTick();
      clearInterval(touchesById[thisId].sustainInterval);
    }



  // test each in touchIdStack for movement
    for (n=0; n<touchIdStack.length; n++){
      thisId=touchIdStack[n];
      thisTouch=touchesById[thisId];
      thisX=Math.floor((thisTouch.pageX-leftPad)/cellSize);
      thisY=Math.floor((thisTouch.pageY-topPad)/(grid*9/2));

      if(thisX<0){thisX=0;}
      if(thisX>11){thisX=11;}
      if(thisY<0){thisY=0;}
      if(thisY>1){thisY=1;}
      xMove=thisX - touchesById[thisId].x;
      yMove=thisY - touchesById[thisId].y;
      //console.log("* touchIdStack touch pageX="+thisTouch.pageX+" thisX "+thisX+" x:"+touchesById[thisId].x+" id "+thisId);

      touchesById[thisId].y=thisY;
      touchesById[thisId].x=thisX;
      if(xMove != 0){
        // x moved
        //dbug2("<br>xMove: "+xMove);

        // test for move into chroma skip
        if((thisX==2)||(thisX==5)||(thisX==8)){thisChromatic=true;}
        else{thisChromatic=false;}
        if((touchesById[thisId].chromatic==false)&&(thisChromatic==true)){
          //skip any changes if chromatic==false and thisX is chromatic
          //dbug2('move into chromatic, skip');
        }
        else{
          // execute x move - silence, new attack, restart sus, update
          touchesById[thisId].x=thisX;

          // increment slideCount for this touch
          touchesById[thisId].slideCount+=xMove;
          // silence
          //dbug2('<br>silence');
          if(touchesById[thisId].sustaining==false){
            attackChannel=thisTouch.attackChannel;
            //dbug2('<br>silence - attackChannel:'+attackChannel);
            window.setTimeout("attackKill("+attackChannel+")", 300);
          }
          else{
            sustainChannel=thisTouch.sustainChannel;
            //dbug2('<br>silence - sustainChannel:'+sustainChannel);
            window.setTimeout("sustainKill("+sustainChannel+")", 300);
          }
          // hi or lo?
          if(thisY==0){instrument="helms";}
          else{instrument="triad";}

          // new attack up or down?
          useSound="error";
          if(xMove<0){useSound=thisX+"-d";}
          if(xMove>0){useSound=thisX+"-u";}
          //console.log("xMove "+xMove);
          if(touchesById[thisId].chromatic==true){
            touchesById[thisId].chromatic=false;
            useSound+="c";
          }
          if(n==0){
            slideQueue.unshift({type:"move", speed:.1, x:thisX, y:thisY});
          }

          // override useSound with slide if moved pas 3 quickly and not already sliding
          if(Math.abs(touchesById[thisId].slideCount)>3){

            if(touchesById[thisId].slideCount < 0){dir="down";}
            else{dir="up";}
            if(dir=="down"){split=4;}
            else{split=8;}
            if(thisX<split){loc="lo";}
            else{loc="hi";}

            if(touchesById[thisId].sliding==false){
              useSound="slide-"+dir+"-"+loc;
              touchesById[thisId].sliding=true;
              touchesById[thisId].slideSample=useSound;
              if(n==0){
                slideQueue.unshift({type:"move", speed:.01, x:thisX, y:thisY});
              }

            }
          }
          if((touchesById[thisId].sliding==true)&&(Math.abs(touchesById[thisId].slideCount)<2)){
            touchesById[thisId].sliding=false;
            useChannel=channelMap[thisY][touchesById[thisId].slideSample];
            comQueue.push({channel:useChannel, mode:"slidepause"});

            //comQueue.push("action=manageSound|channel="+useChannel+"|mode=pause|loop=false");
          }

          window.setTimeout("sustainKill("+touchesById[thisId].sustainChannel+")", 300);

          // always start a sustain, except for when sliding
          touchesById[thisId].sustainChannel++;
          if(touchesById[thisId].sustainChannel >= offset+(channelsPerVoice*(touchesById[thisId].voice+1))){
            touchesById[thisId].sustainChannel=offset+(channelsPerVoice*touchesById[thisId].voice);
          }
          //dbug2("<br>"+thisId+" useSound:"+useSound+" sustainChannel:"+touchesById[thisId].sustainChannel);
          thisSustainChannel=thisTouch.sustainChannel;
          if(useSound.indexOf('slide')>-1){
            slideChannel=channelMap[thisY][useSound];
            //comQueue.push("action=manageSound|channel="+slideChannel+"|mode=play|loop=false");
            comQueue.push({channel:slideChannel, bank:instrument, key:keyName, mode:"play", sound:"banks/"+instrument+"_"+keyName+"/"+useSound+".mp3"});
          }
          else{
            //comQueue.push("action=manageSound|channel="+thisSustainChannel+"|file=banks/"+instrument+"_"+keyName+"/"+useSound+".mp3|mode=play|loop=false");
            comQueue.push({channel:thisSustainChannel, bank:instrument, key:keyName, mode:"play", sound:"banks/"+instrument+"_"+keyName+"/"+useSound+".mp3"});
          }
          // restart sus
          clearInterval(thisTouch.sustainInterval);
          //dbug2('<br>restart sus');
          // to set sustainer intervals
          touchesById[thisId].sustainSound="banks/"+instrument+"_"+keyName+"/"+thisX+"-s.mp3";
          touchesById[thisId].sustainInterval=setInterval("sustainTick("+thisId+");", 700+rnd(100));
        } // end of move into chroma skip
      } //end of x moved conditional
      if((yMove != 0)&&(xMove == 0)){
        // y move, not x move, chromatic doesn't matter, - modify sus note
        if(thisY==0){sustainSound="banks/helms_"+keyName+"/"+thisX+"-s.mp3";}
        else{sustainSound="banks/triad_"+keyName+"/"+thisX+"-s.mp3";}
        touchesById[thisId].sustainSound=sustainSound;
      }
    }//end of each in touchIdStack
    comTick();
    // maybe clear touch cache -- leave at end!
    if(e.touches.length==0){
      touchesById=new Object();
      //dbuga("<br>!! clear all ");
    }
  }//end of mode==play
  ////console.log(touchesById);
}
function bufferSamples(){
  document.getElementById('loadingDiv').style.display="block";

  startTime=new Date().getTime();
  loadList=[];
  //for(var k=0; k<keyArray.length; k++){
  for(var k=8; k<11; k++){
    loadList.push({bank:"triad", key:keyArray[k], sample:"0-s"})
  }
  loadNextSample();
}
function loadNextSample(){
  if(loadList.length>0){
    var item=loadList.pop();
    loadSampleSound(item.bank,item.key,item.sample);
  }
  else{
    var nowTime=new Date().getTime();
    //console.log(nowTime-startTime);
    bufferKey(9);
  }
}
function loadSampleSound(bank,key,sample) {
  var request = new XMLHttpRequest();
  var url="banks/"+bank+"_"+key+"/"+sample+".mp3";
  request.open('GET', url, true);
  request.responseType = 'arraybuffer';

  // Decode asynchronously
  request.onload = (function(k,u) {
    return function(){
      audioContext.decodeAudioData(this.response, function(buffer) {
        //console.log(k);
        samples[k]={buffer:buffer}
        buffersByUrl[u]=buffer;
        loadNextSample();
      }, onError);
    }
  })(key,url);

  request.send();
}

var loadedKeys=[];
function bufferKey(toNum){
  keyNum=toNum;
  keyName=keyArray[keyNum];
  startTime=new Date().getTime();
  document.getElementById('loadingDiv').style.display="block";
  loadList=[];
  banks={"helms":{}, "triad":{}}
  var bankNames=["helms", "triad"];
  //var setupList=["0-a", "0-d", "1-a", "1-d", "1-dc", "1-u", "10-a", "10-d", "10-u", "11-a", "11-u", "2-a", "3-a", "3-d", "3-u", "3-uc", "4-a", "4-d", "4-dc", "4-u", "5-a", "6-a", "6-d", "6-u", "6-uc", "7-a", "7-d", "7-dc", "7-u", "8-a", "9-a", "9-d", "9-u", "9-uc", "slide-down-hi", "slide-down-lo", "slide-up-hi", "slide-up-lo"];
  var setupList=["0-a", "0-s", "0-d", "1-a", "1-s", "1-d", "1-dc", "1-u", "10-a", "10-s", "10-d", "10-u", "11-a", "11-s", "11-u", "2-a", "2-s", "3-a", "3-s", "3-d", "3-u", "3-uc", "4-a", "4-s", "4-d", "4-dc", "4-u", "5-a", "5-s", "6-a", "6-s", "6-d", "6-u", "6-uc", "7-a", "7-s", "7-d", "7-dc", "7-u", "8-a", "8-s", "9-a", "9-s", "9-d", "9-u", "9-uc", "slide-down-hi", "slide-down-lo", "slide-up-hi", "slide-up-lo"];
  if(loadedKeys.indexOf(keyName)==-1){
    for (var b=0; b<bankNames.length; b++){
      for (var s=0; s<setupList.length; s++){
        loadList.push({bank:bankNames[b], key:keyName, sample:setupList[s]})
      }
    }
  }
  loadedKeys.push(keyName);
  loadNextKey();
}
function loadNextKey(){
  if(loadList.length>0){
    var item=loadList.pop();
    loadKeySound(item.bank,item.key,item.sample);
  }
  else{
    var nowTime=new Date().getTime();
    //console.log(nowTime-startTime);
    document.getElementById('loadingDiv').style.display="none";
  }
}
function loadKeySound(bank,key,sample) {
  var request = new XMLHttpRequest();
  var url="banks/"+bank+"_"+key+"/"+sample+".mp3";
  request.open('GET', url, true);
  request.responseType = 'arraybuffer';

  // Decode asynchronously
  request.onload = (function(b,s,u) {
    return function(){
      audioContext.decodeAudioData(this.response, function(buffer) {
        //console.log(b+" "+s);
        banks[b][s]={buffer:buffer}
        buffersByUrl[u]=buffer;

        loadNextKey();
      }, onError);
    }
  })(bank,sample,url);

  request.send();
}
function onError(e){
  console.log('onerror');
}

function sourceBuffer(buffer) {
  var source = audioContext.createBufferSource(); // creates a sound source
  source.buffer = buffer;                    // tell the source which sound to play
  source.connect(masterGain);       // connect the source to the context's destination (the speakers)
  source.connect(delayInputGain);       // connect the source to the context's destination (the speakers)

  source.onended = function(event) {
    this.disconnect();
  }
  return source;
}
function playSource(source){
  //console.log('playSource ');
  source.start(0);
}
var cellSize=1;
var grid=1;
var topPad=0;
var leftPad=0;

var pi=Math.PI;

function drawKeys(){

  var steelCanv=document.getElementById('steelCanvas');
  var steelCtx=steelCanv.getContext('2d');

  if(triadImage !==null){
    steelCtx.drawImage(triadImage,leftPad,topPad+grid*4.5,grid*14,grid*4.5);
  }


  steelCtx.lineJoin="round";
  steelCtx.textBaseline="middle";
  var g=grid*9/14;
  steelCtx.font=g/1.75+"px Arial ";
  steelCtx.lineWidth=g/8;
  //steelCanv.style.letterSpacing=(0-g/5)+"px";

  steelCtx.textAlign="center";
  steelCtx.clearRect(grid*14, topPad, ww-grid*14, grid*9.5);
  steelCtx.fillText("info", leftPad+grid*15.33,topPad+g/2);
  for (var k=0; k<keyArray.length; k++){
    var x=leftPad+grid*15;
    var y=topPad+g*k+2.5*g;
    var atKey=keyArray[k].replace("b","♭");

    if((k==keySelection)||(k==keyNum)){
      steelCtx.beginPath();
      steelCtx.arc(x+g/3,y, g*.6,0,pi*2,true);
      steelCtx.fillStyle="white";
      steelCtx.strokeStyle="black";
      steelCtx.stroke();
      steelCtx.fill();

    }

    steelCtx.fillStyle="black";
    steelCtx.fillText(atKey, x+grid/3,y);
  }

  steelCtx.textAlign="center";
  //steelCtx.fillStyle="white";
  //steelCtx.fillRect(leftPad, topPad+grid*8, cellSize*12, grid*1);
  steelCtx.fillStyle="black";
  for (var i=0; i<intervalSequence.length; i++){
    var item=intervalSequence[i];
    var noteMod=(item.interval+keySelection*5)%12;
    if(keySelection==-1){
      noteMod=(item.interval+keyNum*5)%12;
    }
    var str=keySequence[noteMod]+item.form;
    //console.log(str)
    steelCtx.fillText(str, leftPad+(i+.5)*cellSize, topPad+grid*5);
  }
}
var titleArray=[
  "S.A.V.E. HOMEFRONT STEEL GUITAR",
  "HOW TO PLAY",
  "SELECT A KEY SIGNATURE",
  "PLAYING IN KEY",
  "PLAYING KEY CHANGES",
  "ABOUT S.A.V.E. HOMEFRONT",
];
var helpArray=[
  "Designed_by_JAMBOTS.COM This-unique_instrument brings the sounds of a real pedal steel guitar to your mobile device. The simplified interface requres only a touch and no musical knowlege.",
  "Touch and hold on the strings. Slide slowly left and right to smoothly move between chords.",
  "All 12 key signatures are shown on the right. Drag up and down until it sounds like you are in the right key for the song you are playing.",
  "The fretboard is labeled with chords, mostly from the key you are in. The markers indicate chords just outside of the selected key.",
  "A marked chord will only sound when you touch it directly. Dragging past a marked chord will ignore it.",
  "What The Green Light Means: You’re letting Veterans know you support them as they leave military service and become your community neighbor. Let this light shine from your home or workplace. Green is a powerful color, meaning growth, possibility, beginnings. As this light shines, it shows that through us, the mission continues. Leave A Light On to show your support! Visit savehomefront.org to donate and learn more.",
];
var helpImages=[];
for (var h=0; h<helpArray.length; h++){
  helpImages.push(new Image());
}

//var sourceString="Mr._Zero's PsychoGello Vinyl_Radio_Show The_Monkees Michael_Nesmith Peter_Tork David_Jones Mickey_Dolenz Boyce_and_Hart";


//sourceString=sourceString.toUpperCase();
var resizeTimeout;
var titles=3;
var fieldColor="rgb(247,247,247)";
var borderColor="rgb(40,80,159)";
var calloutColor="rgb(212,66,67)";
var surroundColor="rgb(40,80,159)";
var fontColor="rgb(62,150,205)";
function drawHelp(){
  console.log("drawHelp()");
  var inset=grid;
  var helpCanv=document.getElementById('helpCanvas');
  var helpCtx=helpCanv.getContext('2d');
  helpCanv.width=ww*helpArray.length;
  helpCanv.height=wh*helpArray.length;

  for(var h=0; h<helpArray.length; h++){
    var l=h*ww;
    helpCtx.save();
    helpCtx.translate(l, 0);

    helpCtx.lineWidth=grid/4;
    helpCtx.lineJoin="round";
    helpCtx.fillStyle=fieldColor;
    helpCtx.strokeStyle=borderColor;
    roundRect(helpCtx, grid/2, grid/2, ww-grid, wh-grid, grid/2, true, true);

    helpCtx.font=grid/2+"px batmanforeveralternateregular";
    helpCtx.textAlign="left";
    helpCtx.textBaseline="middle";
    helpCtx.fillStyle=fieldColor;
    helpCtx.strokeStyle=fontColor;
    helpCtx.lineWidth=grid/8;
    helpCtx.strokeText(titleArray[h], inset, inset*1.5);
    helpCtx.fillText(titleArray[h], inset, inset*1.5);

    helpCtx.fillStyle=fontColor;
    helpCtx.strokeStyle=surroundColor;
    if(h>0){roundRect(helpCtx, inset, wh-inset-grid,grid*3, grid, grid/8, true,false);}
    roundRect(helpCtx, ww-inset-grid*3, wh-inset-grid,grid*3, grid, grid/8, true,false);
    helpCtx.fillStyle=calloutColor;
    roundRect(helpCtx, ww-inset-grid*.75, inset-grid*.25, grid, grid, grid/2, true, false);

    if(h==helpArray.length-1){
      helpCtx.textAlign="center";
      helpCtx.fillStyle=fontColor;
      helpCtx.fillText("savehomefront.org", ww/2, wh-inset-grid/2);

    }

    helpCtx.fillStyle=fontColor;
    helpCtx.strokeStyle=surroundColor;

    helpCtx.textAlign="center";
    helpCtx.fillStyle=fieldColor;
    if(h>0){
      helpCtx.fillText("back", inset+grid*1.5, wh-inset-grid/2);
    }
    if(h<5){helpCtx.fillText("next", ww-inset-grid*1.5, wh-inset-grid/2);}
    else{helpCtx.fillText("done", ww-inset-grid*1.5, wh-inset-grid/2);}
    helpCtx.fillText("X", ww-inset-grid*.25, inset+grid*.25);

    helpCtx.fillStyle=fontColor;
    helpCtx.strokeStyle=surroundColor;
    helpCtx.lineWidth=grid/8;
    helpCtx.textAlign="left";

    var confObj={
    titles:0,
    titleFont:"batmanforeveralternateregular",
    text:helpArray[h],
      topHeavy:0,
      embiggen:1.25,

      font:"batmanforeveralternateregular",
      ctx:helpCtx,
      x:inset,
      y:inset*2.5,
      w:ww-inset*2-(wh-inset*4.5),
      h:wh-inset*5,
      stroke0:false,
      fill:true,
      stroke1:false
    };
    textRect(confObj);

    //roundRect(helpCtx, ww-(wh-inset*5)-inset, inset*2.5, (wh-inset*5),(wh-inset*5), grid/2, false, true);
    helpCtx.drawImage(helpImages[h], ww-(wh-inset*5)-inset, inset*2.5, wh-inset*5, wh-inset*5);
    helpCtx.restore();
  }

}
function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
  if (typeof stroke == "undefined" ) {
    stroke = true;
  }
  if (typeof radius === "undefined") {
    radius = 5;
  }
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  if (stroke) {
    ctx.stroke();
  }
  if (fill) {
    ctx.fill();
  }
}
