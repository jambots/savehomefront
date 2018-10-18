var setupList=new Array("0-a", "0-d", "1-a", "1-d", "1-dc", "1-u", "10-a", "10-d", "10-u", "11-a", "11-u", "2-a", "3-a", "3-d", "3-u", "3-uc", "4-a", "4-d", "4-dc", "4-u", "5-a", "6-a", "6-d", "6-u", "6-uc", "7-a", "7-d", "7-dc", "7-u", "8-a", "9-a", "9-d", "9-u", "9-uc", "slide-down-hi", "slide-down-lo", "slide-up-hi", "slide-up-lo");

window.AudioContext = window.AudioContext || window.webkitAudioContext;
var audioContext = new AudioContext();
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
          sources[s].source.stop();
          sources[s].source.disconnect();
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
var keySources=[];
var keySelection=-1;
var keyInterval;
var mode="play";
var loadList=[];
var startTime=0;
var keyArray=["C", "F", "Bb", "Eb", "Ab", "Db", "Gb", "B", "E", "A", "D", "G"];
var keyName="A";
var keyNum=9;
var keySources=[];

function keyTick(){
  var keyUrl="banks/triad_"+keyArray[keySelection]+"/0-s.mp3";
  //console.log(keyUrl);
  var sound=sourceBuffer(buffersByUrl[keyUrl]);
  keySources.push({source:sound});
  sound.start(0);
  drawKeys();
}
function handleSteelEvent(e){
  //console.log(e);
  if((e.type=="touchstart")&&(e.touches.length==1)){
    if(e.touches[0].pageX>leftPad+grid*15){
      var fieldY=e.touches[0].pageY-topPad;
      var yGrid=grid*9/12;
      var y=Math.floor(fieldY/yGrid);
      if(y<0){y=0;}
      if(y>11){y=11;}
      mode="key";
      keySelection=y;
      //console.log(mode+" "+keySelection);
      window.clearInterval(keyInterval);
      keyInterval=window.setInterval("keyTick()", 300);
      keyTick();
    }
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
      }

    bufferKey(keySelection);
    keySelection=-1;
    drawKeys();
    }
  }
  if(mode=="key"){
    if(e.type=="touchmove"){
      var fieldY=e.touches[0].pageY-topPad;
      var yGrid=grid*9/12;
      var y=Math.floor(fieldY/yGrid);
      if(y<0){y=0;}
      if(y>11){y=11;}
      keySelection=y;
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
        touchesById[t.identifier]=t;
      }
      else{
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
      console.log(thisX+" "+thisY);
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
      touchesById[thisId].y=thisY;
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

          if(touchesById[thisId].chromatic==true){
            touchesById[thisId].chromatic=false;
            useSound+="c";
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
  startTime=new Date().getTime();  
  loadList=[];
  for(var k=0; k<keyArray.length; k++){
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
    console.log(nowTime-startTime);
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
    console.log(nowTime-startTime);
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
  console.log(e);
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
  console.log('playSource ');
  source.start(0);
}
var cellSize=1;
var grid=1;
var topPad=0;
var leftPad=0;
function landscapeGeometry(){
  //console.log('landscapeGeometry');
  
  var windowAspect=ww/wh;
  grid=1;
  var contentAspect=16/9;
  topPad=0;
  leftPad=0;
  if(contentAspect>windowAspect){//wide, pad top
    grid=ww/16;
    topPad=(wh-grid*9)/2;
  } else {// tall pad side
    grid=wh/9;
    leftPad=(ww-grid*16)/2;
  }
  cellSize=grid*14/12;
  //console.log(grid);

  var style = document.createElement('style');
  style.type = 'text/css';
  style.innerHTML='';
  style.innerHTML +='body{font-size:'+grid/2.5+'px;}';
  style.innerHTML +='#wrapper{display:none;}';
  style.innerHTML +='#steelCanvas{display:block;}';
  style.innerHTML +='#loadingDiv{background-image:url(imageslarge/loading.png); background-size:contain;}';
  style.innerHTML +='#loadingDiv{display:block; height:'+grid*4+'px; width:'+grid*4+'px;}';
  style.innerHTML +='#loadingDiv{top:'+(wh-grid*4)/2+'px; left:'+(ww-grid*4)/2+'px; position:absolute;}';
  document.getElementsByTagName('head')[0].appendChild(style);
  var steelCanv=document.getElementById('steelCanvas');
  steelCanv.width=ww;
  steelCanv.height=wh;

  var steelCtx=steelCanv.getContext('2d');
  if(helmsImage !==null){
    steelCtx.drawImage(helmsImage,leftPad,topPad,grid*14,grid*4.5);
  }
  if(triadImage !==null){
    steelCtx.drawImage(triadImage,leftPad,topPad+grid*4.5,grid*14,grid*4.5);
  }
  drawKeys();
}
function drawKeys(){
  var steelCanv=document.getElementById('steelCanvas');
  var steelCtx=steelCanv.getContext('2d');
  steelCtx.lineJoin="round";
  steelCtx.clearRect(leftPad+grid*15, topPad, grid, grid*9);
  steelCtx.textAlign="left";
  steelCtx.textBaseline="middle";
  var g=grid*9/12;
  steelCtx.lineWidth=g/5;
 
  steelCtx.font=g/1.5+"px Arial ";
  steelCanv.style.letterSpacing=(0-g/5)+"px";
  for (var k=0; k<keyArray.length; k++){
    var atKey=keyArray[k].replace("b","♭");
    if(k==keyNum){
      steelCtx.strokeStyle="white";
      steelCtx.strokeText(atKey, leftPad+grid*15.25, topPad+g*k+.5*g);
    }

    if(k==keySelection){
      var selectionName=keyArray[keySelection];
      if(loadedKeys.indexOf(selectionName)==-1){
        steelCtx.strokeStyle="red";
      } else {
        steelCtx.strokeStyle="blue";
      }
      steelCtx.strokeText(atKey, leftPad+grid*15.25, topPad+g*k+.5*g);
    }
    steelCtx.fillStyle="black";
   
    steelCtx.fillText(atKey, leftPad+grid*15.25, topPad+g*k+.5*g);
  }
}
