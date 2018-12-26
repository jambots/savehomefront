/* useage

var confObj={
titles:3,
titleFont:"exotic",
text:sourceString,
  topHeavy:.15,
  font:"game",
  ctx:context,
  x:inset,
  y:inset,
  w:vw-inset*2,
  h:vh-inset*2.5,
  stroke0:true,
  fill:true,
  stroke1:false
};
textRect(confObj);

*/

function textRect(conf){
  conf.ctx.font="100px "+conf.font;
  var fieldAspect=conf.w/conf.h;
  //console.log(fieldAspect);
  var fullLength=conf.ctx.measureText(conf.text).width;
  var areaOfText=fullLength*100*conf.embiggen;
  var wSquared=areaOfText*fieldAspect;
  var testW=Math.sqrt(wSquared);
  var testH=areaOfText/testW;

  var lineCount=Math.floor((1-.5*conf.topHeavy)*testH/100)-1;
  //console.log(lineCount);
  var phrases=conf.text.split(" ");
  var lines=[];

  for(l=0; l<lineCount; l++){
    lines.push([]);
    if(l<conf.titles){
      lines[l].push(phrases.shift());
    }
    if(l==conf.titles){
      lines[l]=phrases;
    }
  }

  var longestLineNum=conf.titles;
  var loopout=20000;
  while ((longestLineNum < lines.length-1)&&(loopout>0)){
    loopout--;
    if(loopout==0){alert('loopout');}
    var word=lines[longestLineNum].pop();
    lines[longestLineNum+1].unshift(word);
    longestLineNum=longestNum(conf.ctx,lines,conf.topHeavy)
  }
  //console.log(lines);
  var atY=measureLines(conf.ctx,conf.font,lines,conf.w);
  var underflow=conf.h-atY;
  //console.log(conf.h+' '+atY)
  //console.log(linePad+'='+underflow+'/'+lineCount);
  var linePad=underflow/lineCount;
  var useFont=conf.font;

  drawLines(conf, lines, linePad, conf.ctx, conf.x, conf.y, conf.w, conf.h, conf.stroke0, conf.fill, conf.stroke1);
}
function longestNum(ctx, lines, topHeavy){
  var longestLineLength=-1;
  var longestLineNum=-1;
  for (var l=0; l<lines.length; l++){
    var thisLineLength=ctx.measureText(lines[l].join(" ")).width;
    thisLineLength*=1+(lines.length-l)*topHeavy;
    if(thisLineLength>longestLineLength){
      longestLineLength=thisLineLength;
      longestLineNum=l;
    }
  }
  return longestLineNum;
}
function measureLines(ctx, font, lines, width){
  var atY=0;
  for (var l=0; l<lines.length; l++){
    ctx.font=100+"px "+font;
    var line=lines[l].join(" ");
    var testWidth=ctx.measureText(line).width;
    var frac=width/testWidth;
    var size=100*frac;
    if(line!=""){
      atY+=size;
    }
  }
  //console.log('atY '+atY);
  return atY;
}
var adjust=.15;
function drawLines(conf, lines, linePad, ctx, x, y, w, h, stroke0, fill, stroke1){

  //console.log(linePad);
  ctx.textBaseline="hanging";
  var atY=0;
  for (var l=0; l<lines.length; l++){
    var font=conf.font;
    if(l<conf.titles){font=conf.titleFont;}
    ctx.font="100px "+font;
    var line=lines[l].join(" ");
    //console.log(atY+' '+line);
    var temp=line.split("_");
    line=temp.join(" ");
    var testWidth=ctx.measureText(line).width;
    var frac=w/testWidth;
    var size=100*frac;
    ctx.font=size+"px "+font;
    //console.log(size);
    if(stroke0){ctx.strokeText(line,x,y+atY+size*adjust);}
    if(fill){ctx.fillText(line,x,y+atY+size*adjust);}
    if(stroke1){ctx.strokeText(line,x,y+atY+size*adjust);}
    //ctx.strokeRect(x,y+atY,w,size);
    if(line!=""){
      atY+=size+linePad;
    }
  }
}
