/*import { Schema, MapSchema, ArraySchema, Context } from "@colyseus/schema";
const type = Context.create();
export enum CardsType{
    Spades = 1,
    Clubs=2,
    Hearts=3,
    Diamonds=4
  }
  export class PlayCard extends Schema{
    @type('int32') cardType:CardsType; 
   @type('int32') cardValue;
   @type('int32') cardPoint;
  }
  export class DeckOfCards extends Schema{
  @type([PlayCard]) cardsOfDeck:ArraySchema<PlayCard>;
  @type('int32') deckLength:number;
  @type('int32') counter:number;


  public CopyCard(cD:ArraySchema<PlayCard>){
    this.deckLength=52;  
    console.log("-- copycard- --"+cD.length);
  //  hghlgjk yaha pe locha he use solve karna hen :>#!)/?
this.counter=0;
    this.cardsOfDeck=new ArraySchema<PlayCard>();
    this.cardsOfDeck.clear();
    //this.cardsOfDeck=cD;
    cD.forEach(e=>{
     //   console.log(e);
        this.cardsOfDeck.push(e);
    });
   // console.log("copy gets this");
   /* this.cardsOfDeck.forEach(e=>{
        console.log(e);
    });  */
    //console.log(cD.at(0).cardValue+" ++ "+this.cardsOfDeck.at(0).cardValue);
  /*}

  public  SuffleDeck()
  {
    console.log("-- suffledeck-");
    this.deckLength=52;
    this.cardsOfDeck=new ArraySchema<PlayCard>();
    this.cardsOfDeck.clear();
    
    for( const i in CardsType)
    { 
        if(isNaN(Number(CardsType[i])))
        {
            for(let j:number=1;j<14;j++)
            {
                
                let c:PlayCard;
                c=new PlayCard();
                c.cardType=CardsType[CardsType[i]];
                c.cardValue=j;
                if(j>1 && j<10)
                c.cardPoint=j;
                else if(j==1)
                c.cardPoint=11;
                else
                c.cardPoint=10;
                this.cardsOfDeck.push(c);
               
            }
        }
    }  
    //console.log("---"+this.cardsOfDeck.at(13).cardValue);
  /*  this.cardsOfDeck.forEach(e=>{
        console.log(e);
    });   */
/*  }
  public GetRandomCardForDelar(currentPoints:number=0,opponentsMinPoints:number=0,opponentsMaxPoints:number=0){
    let c:PlayCard;
    c=new PlayCard();
    
    if(currentPoints==0 ){
        let index:number;
       index= Math.floor(Math.random() * (this.deckLength-1 - 0 + 1)) + 0;
       
        c=this.cardsOfDeck.at(index);
       // c=this.GetCard(11,11);
        this.RemoveCard(index);
        return c;
    }
    if(currentPoints>opponentsMinPoints)
    {
        opponentsMinPoints=currentPoints;
    }
    opponentsMinPoints-=currentPoints;
    if(opponentsMinPoints<=0)
    opponentsMinPoints=1;
    opponentsMaxPoints-=currentPoints;
    if(opponentsMaxPoints<=0 )
    opponentsMaxPoints=1;
    
    if(opponentsMaxPoints>12){
        opponentsMaxPoints=12;
    }
    if(opponentsMinPoints>10  ){
        opponentsMinPoints=8;
        opponentsMaxPoints=12;
    }
    if(opponentsMinPoints>opponentsMaxPoints){
        opponentsMaxPoints=12;
        opponentsMinPoints=7;
    }
  
console.log("--"+(opponentsMinPoints+1)+" /// "+ (opponentsMaxPoints-1));
    return this.GetCard(opponentsMinPoints+1, opponentsMaxPoints-1);
    

  }
  public GetRandomCard(winProbability:Boolean=true,currentPoints:number=0,opponentPoints:number=0)
  {
    let c:PlayCard;
    c=new PlayCard();
    /*if(this.counter<5)
    {
        c=this.cardsOfDeck.at(10);
        return c;
        this.counter++;
    }
    
    else{*/
   /* if(currentPoints==0 && opponentPoints==0){
        let index:number;
       index= Math.floor(Math.random() * (this.deckLength-1  + 1));
        c=this.cardsOfDeck.at(index);
        this.RemoveCard(index);
        return c;
    }
    if(winProbability){
        if (currentPoints == 0 && opponentPoints == 0)
            {
                let index:number;
       index= Math.floor(Math.random() * (this.deckLength-1 - 0 + 1)) + 0;
        c=this.cardsOfDeck.at(index);
        this.RemoveCard(index);
        return c;
            }
            
            else if (currentPoints < opponentPoints)
            {
                let tmp:number = (opponentPoints - currentPoints) + 1;
                if (tmp == 11)
                    return this.GetCard(11, 11);
                else if (tmp < 10)
                {
                    if (currentPoints + 10 <= 21)
                        return this.GetCard(tmp, 11);
                    else
                        if ((21 - currentPoints) > tmp)
                        return this.GetCard(tmp, (21 - currentPoints));
                    else
                        return this.GetCard(tmp,tmp);

                }
                else
                    return this.GetCard(tmp, tmp);
            }
            else
            {
                if (currentPoints + 10 <= 21)
                {
                    return this.GetCard(2, 10);
                }
                else
                    return this.GetCard(2, (21 - currentPoints));

            }
    }
    else
    {
        if (currentPoints > 11)
        { //on hit sending burst card
            return this.GetCard(10, 10);
        }
        else {
            if(16-currentPoints<11)
            return this.GetCard(2, (16-currentPoints));
            else
                return this.GetCard(2, 10);
        }
   // }
    }
  }
  public GetCard(min:number,max:number)
  {
   // console.log("ahiyathi call jjay 6");


    let cards:ArraySchema<PlayCard> =new ArraySchema<PlayCard>();
    let point:number = Math.floor(Math.random() * (max - min + 1)) + min;
   let cardsCount:number=0;
   console.log("call from inside");

    //console.log("Card "+point);
    while (cardsCount == 0)
    {
       this.cardsOfDeck.forEach ( c =>
        {
            if (c.cardPoint == point)
            {
                cards.push(c);
                cardsCount++;
            }
        });

        if (cardsCount == 0 )
        {
            console.log("locho");
            
            let oldpoint:number = point;
            
            point = Math.floor(Math.random() * (max - min + 1)) + min;
            if (point == oldpoint) {
                if (point <= max && point > min)
                    point--;
                else
                    point++;
                if (min == max)
                {
                    if (point < 10)
                        point++;
                    else
                        point--;
                }
            }
        }
    }

    let index:number= 0;
    index=Math.floor(Math.random() * ((cardsCount-1) - 0 + 1)) + 0;
   // index= this.cardsOfDeck.indexOf(cards[index]);
   let ind:number=0;
   ind=this.cardsOfDeck.indexOf(cards.at(index));
    let c1:PlayCard;
    c1=new PlayCard();
    c1=this.cardsOfDeck.at(ind); 
    this.RemoveCard(ind);
    //console.log(c1+" "+index +"  "+cardsCount+" "+ind);
    return c1;
}
  RemoveCard(index:number){
      this.cardsOfDeck.deleteAt(index);
      this.deckLength--;
  }
  
  }
  export class GameTable extends Schema
  {
    @type('uint64') minBet:Number;
    @type('uint64') maxBet:Number;
    @type('uint8') handsLimit:Number;
    @type('string') tableName:string;
    @type('uint32') entryFees:number;
  }
  
  
  export class PlayerHandData extends Schema{
  @type('uint8') points:number;
  @type('uint64') bet:number;
  @type([PlayCard]) cards:ArraySchema<PlayCard>;
  @type('boolean') isDouble:boolean;
  @type('boolean') isInsured:boolean;
  @type('boolean') isSurrender:boolean;
  @type('boolean') isSplited:boolean;
  @type('uint8') splitno:number;

  
}  
export class DelarData extends Schema{
    @type('uint8') points:number;
    @type([PlayCard]) cards:ArraySchema<PlayCard>;
  
}

export class Player extends Schema{
    @type('string') sessionId:String;
    @type([PlayerHandData]) playerHandDetails:ArraySchema<PlayerHandData>;
    @type('string') gameId:String;
    @type('int32') currentSplitTurn:number;
    @type('string') PlayerName:String;
    @type('uint8') SitNo:number;
    @type('uint64') totalChipsInCurrentBet:number;
    @type('uint64') lastbet:number;
    @type('uint64') myChips:number;
    @type('uint64') myMoney:number;
    @type('uint8') handsWon:number;
    @type('uint64') totalChipsWon:number;
    @type('boolean') isBot:boolean;
    @type('int8') willWin:number;
    @type('boolean') isConnected:boolean;
    @type('boolean') isRemoved:boolean;
}  
  

export class State extends Schema {

    @type(GameTable)currentTable:GameTable;
    @type('uint8') tableIndex:number;
    @type(DeckOfCards)deck:DeckOfCards;
    @type(DeckOfCards)remainingDeck:DeckOfCards;
    @type('int32') currentHandNo:number;
    @type([Player])playersInGame:ArraySchema<Player>;
    @type('int8') CurrentHand:number;
    @type(DelarData)delar:DelarData;
    @type('boolean') BotWinProbability:boolean;
    @type('int32') currentTurnOfPlayer:number;
    }*/