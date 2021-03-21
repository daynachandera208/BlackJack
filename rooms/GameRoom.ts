import { Room, Client, generateId, Delayed } from "colyseus";
import { Schema, MapSchema, ArraySchema, Context } from "@colyseus/schema";
import { verifyToken, User, IUser } from "@colyseus/social";
import { DeckOfCards } from "../DataStructures/DeckOfCards";
import { DelarData } from "../DataStructures/DelarData";
import { GameTable } from "../DataStructures/GameTable";
import { PlayCard } from "../DataStructures/PlayCard";
import { Player } from "../DataStructures/Player";
import { PlayerHandData } from "../DataStructures/PlayerHandData";
import { State } from "../DataStructures/State";
import { flattenDiagnosticMessageText, idText } from "typescript";
// Create a context for this room's state data.
const type = Context.create();
/**
 * Demonstrate sending schema data types as messages
 */ /*
class Message extends Schema {
  @type("number") num;
  @type("string") str;
}*/
class MyMessage extends Schema {
  @type("string") message: string;
}

// .../*
/*onCreate() {
    this.onMessage("action", (client, message) => {
        const data = new MyMessage();
        data.message = "an action has been taken!";
        this.broadcast(data);
    });
}*/
export class GameRoom extends Room {
  maxClients=3;
FixedBotIndex:number=-1;
isBotFirstTurn:boolean=true;
 playercounter:number=0;
 sittingplayercounter:number=0;
 winprobabilitycamecounter:number=0;
 winprobabilitytarget:number=0;
  isGameFinished=false;
SetTable(){//override this to create new table
  this.state.currentTable=new GameTable();
  this.state.currentTable=new GameTable();
  this.state.currentTable.minBet=10;
  this.state.currentTable.maxBet=5000;
  this.state.currentTable.handsLimit=3;
  this.state.currentTable.entryFees=5;
  this.state.currentTable.tableName="oops";
  console.log('Unwanted one - Table Created without child');
}
  onCreate (options: any) {
    this.setPatchRate(null);
    console.log("Room created.", options);
    this.setState(new State());
    this.SetTable();
    this.state.playersInGame=new ArraySchema<Player>();
    console.log(" Player Entered :::::"+this.state.playersInGame.length);

    this.clock.clear();
    this.clock.start();
    this.state.deck=new DeckOfCards();
    this.state.remainingDeck=new DeckOfCards();
  this.state.deck.SuffleDeck();

  this.setMetadata({
      str: "hello",
      number: 10
    });

    this.setPatchRate(1000 / 20);
    this.setSimulationInterval((dt) => this.update(dt));

    this.onMessage(0, (client, message) => {
      client.send(0, message);
    });

   /* this.onMessage("schema", (client) => {
      const message = new Message();
      message.num = Math.floor(Math.random() * 100);
      message.str = "sending to a single client";
      client.send(message);
    })*/
this.onMessage( "TestMessage",(client,msg)=>{
  console.log("Receved TestMessage from Client :"+client.sessionId +" of " +msg);
  client.send("TestServerMessage",{  msg:"YoHOOHOOHO"});
});
this.onMessage("MyIntro",(client,p)=>{
  console.log("Intro");
  if(this.playercounter==0)
  {
    this.SetBotTimeOut();
  }
this.playercounter++;
this.winprobabilitytarget++;
//console.log(this.playercounter-1+" --- Playercounter");
console.log("p="+p.myMoney);
let player:Player;
player=new Player();
player.sessionId=p.sessionId;
player.playerHandDetails=new ArraySchema<PlayerHandData>();
player.gameId=p.gameId;
player.currentSplitTurn=p.currentSplitTurn;
player.PlayerName=p.PlayerName;
player.SitNo=p.SitNo;
player.totalChipsInCurrentBet=p.totalChipsInCurrentBet;
player.lastbet=p.lastbet;
player.myChips=p.myChips;
player.myMoney=p.myMoney;
player.handsWon=p.handsWon;
player.totalChipsWon=p.totalChipsWon;
player.isBot=p.isBot;
player.willWin=p.willWin;
player.isConnected=p.isConnected;
player.isRemoved=p.isRemoved;
player.isPlaying=true;
console.log(" Player Entered :::::"+this.state.playersInGame.length);
this.state.playersInGame.push(player );
console.log(" Player Entered :::::"+this.state.playersInGame.length);
this.SetPlayerSittingTimeOut(this.playercounter-1);
console.log("Player Enterd "+this.state.playersInGame.at(0)+"---"+this.state.playersInGame.at(0).sessionId);
if(this.playercounter==3){
  this.lock();
  this.SratGame();
}
});
this.onMessage("SitInChair",(client,sit)=>{
  this.state.playersInGame.forEach(element => {
    if(element.sessionId==client.sessionId){
    let flag:boolean=true;
    this.state.playersInGame.forEach(element1 => {
      if(element1.SitNo==sit){
      flag=false;}
    });
    if(flag){
      element.SitNo=sit;
      console.log("sit---"+sit+" -- "+element);
      let p:Player;
      p=new Player();
      p=element;
      console.log("p="+p);
      this.sittingplayercounter++;
      console.log("Player ManualSit "+element+" "+element.SitNo+"  " +element.PlayerName+"+  +"+sit+
      " e"+ element.SitNo);
let tmp:ArraySchema<Player>;
tmp=new ArraySchema<Player>();
tmp.push(element);
      this.broadcast("PlayerSitted",{sitno:sit,player:JSON.stringify(element)});
    }
    }
  });
});
this.onMessage("SetMyCurrentWinProbability",(client,winprobability)=>{
  console.log("<><<<>>>>>>>"+this.state.playersInGame.length);
  this.state.playersInGame.forEach(element => {
console.log(" "+ client.sessionId+"<><><><>"+element.sessionId);
    if(element.sessionId==client.sessionId)
    {
      console.log("MY Win Probability--"+element.SitNo);

      if(winprobability)
      element.willWin=1;
      else
      element.willWin=0;
      this.winprobabilitycamecounter++;
    }
  });
  console.log(this.winprobabilitycamecounter+"   --- "+this.winprobabilitytarget+" Players "+ this.state.playersInGame.length);
  if(this.winprobabilitycamecounter==this.winprobabilitytarget){
    this.StartHand();
  }
});

this.onMessage("HitRequest",(client,splitNo)=>{


this.Hit(this.state.currentTurnOfPlayer,splitNo);

});
this.onMessage("DoubleRequest",(client,splitNo)=>{


  this.Double(this.state.currentTurnOfPlayer,splitNo);
  
  });
this.onMessage("SurrenderRequest",(client,splitNo)=>{


  this.Surrender(this.state.currentTurnOfPlayer,splitNo);
  console.log(" surrender rteq. ");
  });
this.onMessage("StandRequest",(client,splitNo)=>{


  this.Stand(this.state.currentTurnOfPlayer,splitNo);
  
  });
  this.onMessage("GetTables",(client)=>{
    let tables:GameTable[];
    tables=new Array(3);
    tables[0]=new GameTable();
    tables[0].minBet=10;
    tables[0].maxBet=5000;
    tables[0].handsLimit=3;
    tables[0].entryFees=5;
    tables[0].tableName="Play";
    tables[1]=new GameTable();
    tables[1].minBet=100;
    tables[1].maxBet=50000;
    tables[1].handsLimit=5;
    tables[1].entryFees=10;
    tables[1].tableName="Toureny";
    tables[2]=new GameTable();
    tables[2].minBet=1000;
    tables[2].maxBet=50000;
    tables[2].handsLimit=7;
    tables[2].entryFees=15;
    tables[2].tableName="casinos";
    client.send("TableDetails",{data:tables});
  });
  this.onMessage("InsureRequest",(client,splitNo)=>{

    this.Insure(this.state.currentTurnOfPlayer);
    
    });
    this.onMessage("SplitRequest",(client,splitNo)=>{


      this.Split(this.state.currentTurnOfPlayer);
      
      });
  this.onMessage("InitialBetByPlayer",(client,betamt)=>{
    let flag:boolean=true;
this.state.playersInGame.forEach(element => {
    if(element.sessionId==client.sessionId)
      {
        element.playerHandDetails[0].bet=betamt;
        element.lastbet=betamt;
        element.totalChipsInCurrentBet+=betamt;
        element.myChips-=betamt;
      console.log("Request by player Index-"+element.SitNo);

          this.broadcast("SetInitialBet",{bet:betamt,sitno:element.SitNo});
      }
      if(element.playerHandDetails.at(0).bet==0)
      flag=false;
    });
    if(flag)
    {
      //startcard distribution from here
      this.DistributrInitailCards();

    }
  });
    this.onMessage("*", (client, type, message) => {
      console.log(`received message "${type}" from ${client.sessionId}:`, message);
    });
  }

  async onAuth (client, options) {
   // console.log("onAuth(), options!", options);
    //return await User.findById(verifyToken(options.token)._id);
  return true;
  }



  onJoin (client: Client, options: any, user: IUser) {
    console.log("client joined!", client.sessionId);
    client.send("GiveIntro");
    //client.send("TestCode",{tc:this.state});
    //this.state.entities[client.sessionId] = new Player();
    if(this.playercounter==0)
    {
      
      client.send("PlayersInGame",{playerCount:this.playercounter,player1Data:null,player2Data:null});
    }
    else  if(this.playercounter==1)
    {
      //client.send("PlayersInGame",{playerCount:0,playerData:null});
     console.log(this.state.playersInGame.at(0));
      client.send("PlayersInGame",{playerCount:this.playercounter,player1Data:JSON.stringify(this.state.playersInGame.at(0)),player2Data:null});
    }
    else
    {
      console.log(this.state.playersInGame.at(0)+"--"+this.state.playersInGame.at(1));
    
      client.send("PlayersInGame",{playerCount:this.playercounter,player1Data:JSON.stringify(this.state.playersInGame.at(0)),player2Data:JSON.stringify(this.state.playersInGame.at(1))});
  
    }
}

  async onLeave (client: Client, consented: boolean) {
    //this.state.entities[client.sessionId].connected = false;
   // if(consented == true)
    {
      console.log(`Player has self disconnaction`);
      this.removePlayer(client.sessionId);
    }
   /* else{
                  console.log('Room Left by Client:'+client.sessionId);
                  if(this.isGameFinished==true)
                  {
                    //send final data to save;
                    this.state.playersInGame.forEach(element => {
                      if(element.isRemoved=false || element.isConnected==true){
                        this.broadcast("SaveLatestData",{player:JSON.stringify(element)});
                      }
                    });
                  }
                  else
                  {
                    let p:Player;
                    this.state.playersInGame.forEach(element => {
                      if(element.sessionId==client.sessionId){
                        p=element;
                      }
                    });
                    client.send("SaveLatestData",{player:JSON.stringify(p)});
                    try {
                      if (consented) {
                          this.removePlayer(client.sessionId);
                      }
                      else {
                        console.log("Waiting for client ");
                          this.setPlayerConnected(client.sessionId, false);
                          await this.allowReconnection(client, 10);
                          this.setPlayerConnected(client.sessionId, true);
                          console.log("Player reconnected sucessfully..!");
                        /* client.send("ReconnectionPlayerData",{player1:this.state.playersInGame[0],player2:this.state.playersInGame[1],player3:this.state.playersInGame[2],currentHandNo:this.state.currentHandNo});
                          this.state.playersInGame.forEach(element => {
                            let spNo:number=0;
                            if(element.playerHandDetails[0].isSplited==true)
                            {
                              spNo=1;
                            client.send("ReconnectionPlayerHandData",{sitNo:element.SitNo,SplitNo:spNo,handData:element.playerHandDetails[0]});
                            spNo=2;
                          client.send("ReconnectionPlayerHandData",{sitNo:element.SitNo,SplitNo:spNo,handData:element.playerHandDetails[1]});
                            }
                            else
                            {
                            client.send("ReconnectionPlayerHandData",{sitNo:element.SitNo,SplitNo:spNo,handData:element.playerHandDetails[0]});
                            }

                          });
                          this.state.playersInGame.forEach(element => {
                            let spNo:number=0;
                            if(element.playerHandDetails[0].isSplited.isSplited==true)
                            {
                              spNo=1;
                              element.playerHandDetails[0].cards.array.forEach(playerCard => {
                                let ct:number=0;
                                ct=playerCard.CardsType;
                                this.broadcast("SaveCard",{sitNo:element.SitNo,splitNo:spNo,points:playerCard.cardPoint,cType:ct,cValue:playerCard.cardValue});
                              });
                            spNo=2;
                            element.playerHandDetails[1].cards.array.forEach(playerCard => {
                              let ct:number=0;
                              ct=playerCard.CardsType;
                              this.broadcast("SaveCard",{sitNo:element.SitNo,splitNo:spNo,points:playerCard.cardPoint,cType:ct,cValue:playerCard.cardValue});
                            });
                            }
                            else
                            {
                              element.playerHandDetails[0].cards.array.forEach(playerCard => {
                                let ct:number=0;
                                ct=playerCard.CardsType;
                                this.broadcast("SaveCard",{sitNo:element.SitNo,splitNo:spNo,points:playerCard.cardPoint,cType:ct,cValue:playerCard.cardValue});
                              });
                            }
                            
                          //  points:newPoints,cType:ct,cValue:c.cardValue
                          });*/
                       /*   this.state.delar.cards.forEach(element => {
                            let ct:number=0;
                            ct=element.CardsType;
                            this.broadcast("SaveDelarCard",{points:element.cardPoint,cType:ct,cValue:element.cardValue});
                          });
                        // if(){
                        // this.broadcast("SaveImportantReconnectData",{delarPoint:this.state.delar.points});//,currentTurn:,splitNo:,timeSpent:});
                        /*  }
                          else if(){

                          }
                          else{

                          }*/
                        /*  console.log(`Client with sessionId ${client.sessionId} successfully reconnected!!`);
                      }

                  } catch (e) {
                      console.log(`Player has not reconnected, removing from Room`);
                      this.removePlayer(client.sessionId);
                      
                  }
                }
    }*/
   
  }
  removePlayer(sessionId: string) {
    this.state.playersInGame.forEach(element => {
      if(element.sessionId==sessionId){
        console.log("element"+element.sessionId+" -- "+element.isRemoved);
        element.isRemoved=true;
        
      }
    });
    this.playercounter--;
    if(this.playercounter<2){
        let runnerupIndex:number=0;
        let winningPlayerIndex:number=-1;
        this.state.playersInGame.forEach(element => {
          if(element.isRemoved!=true && element.isConnected==true )
          {
              winningPlayerIndex=element.SitNo-1;
          }
        });
                  if(winningPlayerIndex!=-1){
          this.state.playersInGame.at(winningPlayerIndex).myMoney+=(this.state.currentTable.entryFees*3)/2;
          console.log("  winnwr /Index: "+winningPlayerIndex);
          this.state.playersInGame.forEach(element => {
            if(element.isRemoved=false || element.isConnected==true){
              this.broadcast("SaveLatestData",{player:JSON.stringify(element)});
            }
          });
          this.broadcast("PricePool",{winner:winningPlayerIndex,runner:runnerupIndex});
                  }
                  
          this.clock.clear();
          this.clock.start();
                  
          this.clock.setTimeout(()=>{
            this.isGameFinished=true;
            this.disconnect();
          },2000);
    }
  }

    setPlayerConnected(sessionId: string, value: boolean) {
      this.state.playersInGame.forEach(element => {
        if(element.sessionId==sessionId)
        {
            element.isConnected=value;
        }
      });
  }
  update (dt?: number) {
    // console.log("num clients:", Object.keys(this.clients).length);
  }

  onDispose () {
    console.log("DemoRoom disposed.");
  }

  SetBotTimeOut(){
   
    this.clock.setTimeout(()=>{
      if(this.playercounter<3)
      {
        this.playercounter++;
        let p:Player=new Player();
        p.PlayerName = "Bot";
				p.gameId = "999777888";
				p.myChips = 4000000;
        p.sessionId = "123456789";
        p.myMoney=5000;
				p.lastbet = 0;
				p.handsWon = 0;
        p.isBot = true;
        p.isPlaying=true;
        p.isConnected=true;
        p.isRemoved=false;
				p.totalChipsWon = 0;
				p.totalChipsInCurrentBet = 0;
        p.SitNo = 0;
        p.willWin=-1;
        p.currentSplitTurn=0;
        console.log(this.playercounter-1+" --- -- ");//+this.state.playersInGame[this.playercounter-1]);
       // this.state.playersInGame[this.playercounter-1]=new Player();
        this.state.playersInGame.push(p);

        if(this.state.playersInGame.at(this.playercounter-1).SitNo==0){
          for(let i:number=1;i<4;i++){
            let flag:boolean;
            flag=true;
          
          this.state.playersInGame.forEach(element => {
            if(element.SitNo==i){
             flag=false;
            }
          });
          if(flag)
          {
            this.state.playersInGame[this.playercounter-1].SitNo=i;
        //console.log("sit forcefully---"+i);
        this.sittingplayercounter++;
let p:Player;
p=new Player();
p=this.state.playersInGame.at(this.playercounter-1);
console.log("Bot AutoSit "+p+" "+p.SitNo+"<>"+this.state.playersInGame.length);
        this.broadcast("PlayerSitted",{sitno:i,player:JSON.stringify(p)});
           break; 
          }
          }
        }
        if(this.playercounter==3){
          this.lock();
          this.SratGame();
          
        }
      }
    },10000);
  }
  SetPlayerSittingTimeOut(PlayerIndex:number){
    
    
    console.log(PlayerIndex+" -- "+ this.state.playersInGame.at(PlayerIndex).SitNo);

    this.clock.setTimeout(()=>{
      //console.log(PlayerIndex+" -- "+ this.state.playersInGame[PlayerIndex]);
      if(this.state.playersInGame.at(PlayerIndex).SitNo==0){
        for(let i:number=1;i<4;i++){
          let flag:boolean;
          flag=true;
        
        this.state.playersInGame.forEach(element => {
          if(element.SitNo==i){
           flag=false;
          }
        });
        if(flag)
        {
          this.state.playersInGame.at(PlayerIndex).SitNo=i;
      //console.log("sit forcefully---"+i);
      let p:Player=new Player();
      console.log(typeof(p));
      p=this.state.playersInGame[PlayerIndex];
      this.sittingplayercounter++;
      var player=new Player(p);
      console.log("Player AutoSit "+this.state.playersInGame[PlayerIndex]+" "+this.state.playersInGame[PlayerIndex].SitNo+" "+typeof(p)+" "+new Player(p)+"----"+player);
      this.broadcast("PlayerSitted",{sitno:i,player:JSON.stringify(player)});
         break; 
        }
        }
      }

    },5000);
  }

  SratGame(){
    console.log("<><><"+this.state.playersInGame.length);

    if(this.sittingplayercounter<3){
      
      this.state.playersInGame.forEach(element => {
        if(element.SitNo==0){
          for(let i:number=1;i<4;i++){
            let flag:boolean;
            flag=true;
          
          this.state.playersInGame.forEach(element1 => {
            if(element1.SitNo==i){
             flag=false;
            }
          });
          if(flag)
          {
            element.SitNo=i;
        //console.log("sit forcefully---"+i);
        this.sittingplayercounter++;
      console.log("Player AutoSit on start "+element+" "+element.SitNo);

        this.broadcast("PlayerSitted",{sitno:i,player:JSON.stringify(element)});
           break; 
          }
          }
        }
      });
    }
    console.log("Start Game Logic From Here"+this.state.playersInGame.length);
    
   /* let tempSortedPlayers:ArraySchema<Player>;//sorting Player in array
    tempSortedPlayers=new ArraySchema<Player>();
    for(let i:number=0;i<3;i++)
    {
      this.state.playersInGame.forEach(element => {
        if(element.SitNo==i+1)
        {
          tempSortedPlayers[i]=element;
          if(element.isBot)
          {
            this.FixedBotIndex=i;
            
          }
        }
      });
    }
    this.state.playersInGame=tempSortedPlayers;*/
    let tmp:ArraySchema<Player>=new ArraySchema<Player>();
    for(let i:number=1;i<4;i++){
  this.state.playersInGame.forEach(element => {
  if(element.SitNo==i){
    console.log(" Let's see "+element.SitNo+"  sit is "+element.isBot);
    if(element.isBot)
          {
            this.FixedBotIndex=i-1;
    console.log("we got bot "+element.SitNo+"  sit is "+element.isBot+" at index "+this.FixedBotIndex);

            
          }
   tmp.push(element);
   //console.log(" -/-/-/-/-/-/-/-/-/-/-/ :"+element.SitNo);
  //console.log(" 0000000777777889:  -------------------------"+this.state.playersInGame.length);
  
  }
  });
    }
    this.state.playersInGame=new ArraySchema<Player>();
    tmp.forEach(element => {
     
      this.state.playersInGame.push(element);
    });
    this.state.playersInGame.forEach(element => {
      element.myMoney-=this.state.currentTable.entryFees;
    });
    console.log(this.state.playersInGame.length+"-<->-");
    
this.state.currentHandNo=1;
this.CheckPlayerChips();
    this.broadcast('InitializeNewHand',{handNo:this.state.currentHandNo});
    console.log("initalizing new hand"+this.state.playersInGame.length);
    
  }

  public StartHand(){
    if(this.FixedBotIndex!=-1){
      let probability:number=Math.floor(Math.random() * 10);
      if(probability>6){
        this.state.playersInGame.at(this.FixedBotIndex).willWin=1;
      }
      else
      this.state.playersInGame.at(this.FixedBotIndex).willWin=0;

      console.log("Bot Win Probability ..:"+this.state.playersInGame.at(this.FixedBotIndex).willWin)
//add logic for bot winnings accrding to players
     // this.state.playersInGame[]
    }
    for(let i:number=0;i<3;i++)
    {
      console.log(" playerhands data initialized for sit no + "+(i+1));
      this.state.playersInGame[i].playerHandDetails=new ArraySchema<PlayerHandData>();
      let phd:PlayerHandData=new PlayerHandData();
      phd=new PlayerHandData();
      phd.points=0;
      phd.bet=0;
      phd.cards=new ArraySchema<PlayCard>();
      phd.isDouble=false;
      phd.isInsured=false;
      phd.isSplited=false;
      phd.isSurrender=false;
      phd.splitno=1;
      this.state.playersInGame[i].playerHandDetails.push(phd);
      this.state.playersInGame[i].currentSplitTurn=0;
    }
    this.state.delar=new DelarData();
    this.state.delar.cards=new ArraySchema<PlayCard>();
    this.state.delar.points=0;
   this.state.delar=new DelarData();
this.state.delar.points=0;
this.state.delar.cards=new ArraySchema<PlayCard>();
    this.broadcast("StartNewHand",{player1:JSON.stringify(this.state.playersInGame[0].playerHandDetails[0]),player2:JSON.stringify(this.state.playersInGame[1].playerHandDetails[0]),player3:JSON.stringify(this.state.playersInGame[2].playerHandDetails[0])});
  if(this.FixedBotIndex!=-1 && this.state.playersInGame[this.FixedBotIndex].isPlaying){
    this.clock.setTimeout(()=>{
      
     // console.log("Bot bet Index-"+this.FixedBotIndex);
     let tmp:number= Math.floor(Math.random() * 6);
   //  console.log(" Bot winn go upto :"+tmp);
     let betamt:number=this.state.currentTable.minBet;
      for(let  j:number=2;j<=tmp;j++){
      //  console.log(" Moniter value of betamt="+betamt+"-----with  --"+this.state.playersInGame[this.FixedBotIndex].myChips);
             
              let newBetAmt:number=0;
              if(j%2==0){
              newBetAmt=betamt*5;
               
              }
              else{
                newBetAmt= betamt*2;
              }
              if(newBetAmt>this.state.playersInGame[this.FixedBotIndex].myChips)
              {
             //   console.log("break11111"+betamt);

                break;
          //      console.log("break222");
              }
              else
              {
                betamt=newBetAmt;
              }

      }
      
this.state.playersInGame[this.FixedBotIndex].playerHandDetails[0].bet=betamt;
this.state.playersInGame[this.FixedBotIndex].myChips-=betamt;
this.isBotFirstTurn=true;
         this.broadcast("SetInitialBet",{bet:betamt,sitno:this.FixedBotIndex+1});
         let flag:boolean=true;
         for(let i:number=0;i<3;i++){
          
           if(this.state.playersInGame[i].playerHandDetails[0].bet==0)
           flag=false;
         }
         if(flag)
         {
           //startcard distribution from here
           this.DistributrInitailCards();
     
         }




   },Math.floor(Math.random() * (7000 - 3000 + 1) + 2000));
  }
     this.clock.setTimeout(()=>{
      for(let i:number=0;i<3;i++){
        if(this.state.playersInGame[i].playerHandDetails[0].bet==0 && this.state.playersInGame[i].isPlaying )
        {
          this.state.playersInGame[i].playerHandDetails[0].bet=this.state.currentTable.minBet;
      console.log("Timeout Index-"+i);
          
          this.broadcast("SetInitialBet",{bet:this.state.currentTable.minBet,sitno:(i+1)});
        }
      }

      this.DistributrInitailCards();
    },10000);
    
  }
  public DistributrInitailCards(){
    console.log("start card distribution logic from here");
    this.clock.clear();//for sake of infinitie loops in GetCard();
  this.clock.start();

    this.state.remainingDeck=new DeckOfCards();
   // console.log(this.state.deck.DeckOfCards.at(0));
    this.state.remainingDeck.CopyCard(this.state.deck.cardsOfDeck);
    let i:number=0;



    this.clock.setInterval(()=>{
//console.log("Distributing cards :::"+this.state.playersInGame.length);
//console.log(" <<<<<>>>>>>>>>>>>>>><>"+this.state.playersInGame.length );
/*this.state.playersInGame.forEach(element => {
  console.log("1. "+element.playerHandDetails.length);
  console.log("2. "+element.playerHandDetails[0].cards.length);
  console.log("3. "+element.willWin);
  console.log("4. "+element.PlayerName);
});*/
if(i<3){
if(this.state.playersInGame[i].isPlaying){
      let c:PlayCard;
      let flag:boolean;
      c=new PlayCard();
      if(this.state.playersInGame[i].willWin==1){
        flag=true;
      }
      else
      flag=false;
   //  console.log("call from index");
      c=this.state.remainingDeck.GetRandomCard(flag,this.state.playersInGame[i].playerHandDetails[0].points,this.state.delar.points);
     // console.log(" return type -- "+c.cardType);
//console.log(" cards :::"+this.state.playersInGame[i].playerHandDetails[0].cards.length+" "+this.state.playersInGame[i].PlayerName);

      this.state.playersInGame[i].playerHandDetails[0].cards.push(c);
//console.log(" cards :::"+this.state.playersInGame[i].playerHandDetails[0].cards.length+" "+this.state.playersInGame[i].PlayerName);

      let newPoints:number=0;
     // console.log(" 11111 "+newPoints);
      let acecount:number=0;
      this.state.playersInGame[i].playerHandDetails[0].cards.forEach(element => {
    //    console.log(element);
                if (element.cardPoint == 11)
                {
                    acecount++;
                }
                // else
                newPoints += element.cardPoint;
            //    console.log(" 1.22222 "+newPoints+"  "+ element.cardPoint);

            
      });
      for (let i1:number = 0; i1 < acecount; i1++)
            {
                if (newPoints > 21)
                {
                    newPoints -= 10;
                }
            }
      //console.log(" 22222 "+newPoints);

            this.state.playersInGame[i].playerHandDetails[0].points=newPoints;
            let ct:number=c.cardType;
      //      console.log((i+1)+"  "+ct+" "+c.cardValue+"  "+newPoints);
      
      //this.broadcast("DistributeMainCard",{sitno:(i+1),points:newPoints,cType:ct,cValue:c.cardValue});
      this.broadcast("DistributeMainCard",{sitno:(i+1),points:newPoints,card:JSON.stringify(c)});
     } }
          else if(i==3)
          {
            



            
            let c:PlayCard;
      let flag:boolean;
      c=new PlayCard();
    
     // console.log("call from Delar index");
      let minPoints:number=2;
      let maxPoints:number=21;
      this.state.playersInGame.forEach(element => {
       // console.log(element.playerHandDetails[0].points);
        if(element.willWin==true && element.playerHandDetails[0].points<maxPoints){
          maxPoints=element.playerHandDetails[0].points;
     // console.log(minPoints,maxPoints);

          
        }
        else if(element.willWin==false && element.playerHandDetails[0].points> minPoints)
        {
          minPoints=element.playerHandDetails[0].points;
     // console.log(minPoints,maxPoints);

        }
      });
    //  console.log(this.state.delar.points,minPoints,maxPoints);
      c=this.state.remainingDeck.GetRandomCardForDelar(this.state.delar.points,minPoints,maxPoints);+
     // console.log(" return type -- "+c.cardType);
    //  console.log(" Delar Cards"+this.state.delar.cards.length);

      this.state.delar.cards.push(c);
      let newPoints:number=0;
     // console.log(" 11111 "+newPoints);
      let acecount:number=0;
      this.state.delar.cards.forEach(element => {
    //    console.log(element);
                if (element.cardPoint == 11)
                {
                    acecount++;
                }
                // else
                newPoints += element.cardPoint;
            //    console.log(" 1.22222 "+newPoints+"  "+ element.cardPoint);

            
      });
      for (let i1:number = 0; i1 < acecount; i1++)
            {
                if (newPoints > 21)
                {
                    newPoints -= 10;
                }
            }
      //console.log(" 22222 "+newPoints);

            this.state.delar.points=newPoints;
            let ct:number=c.cardType;
      //      console.log((i+1)+"  "+ct+" "+c.cardValue+"  "+newPoints);
      this.broadcast("DistributeMainCard",{sitno:(i+1),points:newPoints,card:JSON.stringify(c)});
      //this.broadcast("DistributeMainCard",{sitno:(i+1),points:newPoints,cType:ct,cValue:c.cardValue});
      console.log(" Delar Cards"+this.state.delar.cards.length);

            if(this.state.delar.cards.length==2)
               {
                 this.state.currentTurnOfPlayer=0;
                 this.clock.clear();
                 this.clock.start();
                this.GetNextTurn();  
 


               }i=-1;
            
          }
      i++;
    },1000);
  }
public GetNextTurn(){
  this.clock.clear();
  this.clock.start();

console.log("Get Next Turn..!");
this.state.currentTurnOfPlayer++;
  if(this.state.currentTurnOfPlayer>3)
  {
console.log("DelarsTurn Strats Here");
this.DelarsHandPlay();
  }
  else if(this.state.playersInGame[this.state.currentTurnOfPlayer-1].isPlaying==false)
  {
    this.GetNextTurn();
  }
  else
  {
    if(this.state.currentTurnOfPlayer<4){
    if(this.state.playersInGame[this.state.currentTurnOfPlayer-1].isBot==true)
    {
      this.FixBotTurn();
    this.broadcast("StartNewTurn",{turnOfPlayer:this.state.currentTurnOfPlayer,splitNo:this.state.playersInGame[this.state.currentTurnOfPlayer-1].currentSplitTurn});
      this.clock.setTimeout(()=>{
       
  
        this.Stand(this.state.currentTurnOfPlayer,0);
      },10000);
    }
    else
    {
    
      this.clock.setTimeout(()=>{
        
        console.log("Auto stand");
        this.Stand(this.state.currentTurnOfPlayer,this.state.playersInGame[this.state.currentTurnOfPlayer-1].currentSplitTurn);
      },10000);
    this.broadcast("StartNewTurn",{turnOfPlayer:this.state.currentTurnOfPlayer,splitNo:this.state.playersInGame[this.state.currentTurnOfPlayer-1].currentSplitTurn});
    }
  }
  }
}
public RepeatCurrentTurn(){
  this.clock.clear();
  this.clock.start();
  if(this.state.playersInGame[this.state.currentTurnOfPlayer-1].isBot==true)
  {
    this.FixBotTurn();
    this.broadcast("StartNewTurn",{turnOfPlayer:this.state.currentTurnOfPlayer,splitNo:this.state.playersInGame[this.state.currentTurnOfPlayer-1].currentSplitTurn});
  }
  else
  {
    
    this.clock.setTimeout(()=>{
      
      console.log("stand");

      this.Stand(this.state.currentTurnOfPlayer,this.state.playersInGame[this.state.currentTurnOfPlayer-1].currentSplitTurn);
    },10000);
    this.broadcast("StartNewTurn",{turnOfPlayer:this.state.currentTurnOfPlayer,splitNo:this.state.playersInGame[this.state.currentTurnOfPlayer-1].currentSplitTurn});
   
  }
}

FixBotTurn(splitNo:number=0)
{/*
console.log(" Botiya nu logic<>"+this.state.playersInGame.length );
this.state.playersInGame.forEach(element => {
  console.log("1. "+element.playerHandDetails.length);
  console.log("2. "+element.playerHandDetails[0].cards.length);
  console.log("3. "+element.willWin);
  console.log("4. "+element.PlayerName);
});*/
this.clock.clear();
this.clock.start();
if(splitNo==0)
{
  if(this.state.playersInGame[this.FixedBotIndex].willWin==false)
  {
    if(Math.random()>0.3)
    {
      //hit
      this.clock.setTimeout(()=>{
        this.Hit(this.state.currentTurnOfPlayer,splitNo);
  
      },Math.floor(Math.random() * (7000 - 3000 + 1) + 3000));
    }else{
      //stand
      this.clock.setTimeout(()=>{
        this.Stand(this.state.currentTurnOfPlayer,splitNo);
  
      },Math.floor(Math.random() * (7000 - 3000 + 1) + 3000));
    }
  }
  else {
    if(this.state.playersInGame[this.FixedBotIndex].playerHandDetails[0].cards.at(0).cardPoint==this.state.playersInGame[this.FixedBotIndex].playerHandDetails[0].cards.at(1).cardPoint && this.isBotFirstTurn==true)
    {
      if(this.state.playersInGame[this.FixedBotIndex].playerHandDetails[0].cards.at(0).cardPoint==10){
        //stand
        this.clock.setTimeout(()=>{
          this.Stand(this.state.currentTurnOfPlayer,splitNo);
  
        },Math.floor(Math.random() * (7000 - 3000 + 1) + 3000));

      }
      else if(this.state.playersInGame[this.FixedBotIndex].playerHandDetails[0].cards.cardPoint==8 || this.state.playersInGame[this.FixedBotIndex].playerHandDetails[0].cards.at(0).cardPoint==11 || this.state.playersInGame[this.FixedBotIndex].playerHandDetails[0].cards.at(0).cardPoint>=this.state.delar.cards.at(0).cardPoint)
      {
        //Split
        this.clock.setTimeout(()=>{
          this.Split(this.state.currentTurnOfPlayer);
  
        },Math.floor(Math.random() * (7000 - 3000 + 1) + 3000));
      }
      
    }
    if(this.state.playersInGame[this.FixedBotIndex].playerHandDetails[0].points>10||this.state.playersInGame[this.FixedBotIndex].playerHandDetails[0].points <=14 && this.isBotFirstTurn==true)
     { if(Math.random()>0.7){
        //Double
        this.clock.setTimeout(()=>{
          this.Double(this.state.currentTurnOfPlayer,splitNo);
  
        },Math.floor(Math.random() * (7000 - 3000 + 1) + 3000));

     }}
    if(this.state.playersInGame[this.FixedBotIndex].playerHandDetails[0].points<18){
     //hit
      this.clock.setTimeout(()=>{
        this.Hit(this.state.currentTurnOfPlayer,splitNo);
  
      },Math.floor(Math.random() * (7000 - 3000 + 1) + 3000));
    
    }
    else{

      //stand
      this.clock.setTimeout(()=>{
        this.Stand(this.state.currentTurnOfPlayer,splitNo);
  
      },Math.floor(Math.random() * (7000 - 3000 + 1) + 3000));
    }
  }
}
else
{
      if(this.state.playersInGame[this.FixedBotIndex].playerHandDetails[splitNo-1].cards.at(0).cardPoint==this.state.playersInGame[this.FixedBotIndex].playerHandDetails[splitNo-1].cards.at(0).cardPoint)
      {
        if(this.state.playersInGame[this.FixedBotIndex].playerHandDetails[splitNo-1].cards.at(0).cardPoint==10){
          //stand
          this.clock.setTimeout(()=>{
            this.Stand(this.state.currentTurnOfPlayer,splitNo);
  
          },Math.floor(Math.random() * (7000 - 3000 + 1) + 3000));

        }
        else if(this.state.playersInGame[this.FixedBotIndex].playerHandDetails[splitNo-1].cards.cardPoint==8 || this.state.playersInGame[this.FixedBotIndex].playerHandDetails[splitNo-1].cards.at(0).cardPoint==11 || this.state.playersInGame[this.FixedBotIndex].playerHandDetails[splitNo-1].cards.at(0).cardPoint>=this.state.delar.cards.at(0).cardPoint)
        {
          //Split
          this.clock.setTimeout(()=>{
            this.Split(this.state.currentTurnOfPlayer);
  
          },Math.floor(Math.random() * (7000 - 3000 + 1) + 3000));
        }
        
      }
      if(this.state.playersInGame[this.FixedBotIndex].playerHandDetails[splitNo-1].points>10||this.state.playersInGame[this.FixedBotIndex].playerHandDetails[splitNo-1].points <=14)
      { if(Math.random()>0.7){
          //Double
          this.clock.setTimeout(()=>{
            this.Double(this.state.currentTurnOfPlayer,splitNo);
  
          },Math.floor(Math.random() * (7000 - 3000 + 1) + 3000));

      }}
      if(this.state.playersInGame[this.FixedBotIndex].playerHandDetails[splitNo-1].points<18){
      { //hit
        this.clock.setTimeout(()=>{
          this.Hit(this.state.currentTurnOfPlayer,splitNo);
  
        },Math.floor(Math.random() * (7000 - 3000 + 1) + 3000));
      }
      }
      else{

        //stand
        this.clock.setTimeout(()=>{
          this.Stand(this.state.currentTurnOfPlayer,splitNo);
    
        },Math.floor(Math.random() * (7000 - 3000 + 1) + 3000));
      }
}
}
DisplayPricePool()
{
console.log("all hands over get price pool..!");
let winningPlayerIndex:number=0;
let runnerupIndex:number=0;
let maxHandsWon:number=0;
let maxWonCounts:number=0;
    for(let i:number=0;i<3 ;i++){
        if(this.state.playersInGame[i].handsWon>maxHandsWon)
        {
          maxHandsWon=this.state.playersInGame[i].handsWon;
          winningPlayerIndex=i;
        }
        console.log("-/-/-/- "+this.state.playersInGame[i].totalChipsWon);
    }
    for(let i:number=0;i<3;i++)
    {
        if(this.state.playersInGame[i].handsWon==maxHandsWon)
        {
          maxWonCounts++;
        }
    }
    if(maxWonCounts!=1)
    {
      
          for(let i:number=0;i<3;i++)
        {
          if(this.state.playersInGame[i].handsWon==maxHandsWon && i!=winningPlayerIndex)
          {
            if(this.state.playersInGame[winningPlayerIndex].totalChipsWon<this.state.playersInGame[i].totalChipsWon)
            {
              winningPlayerIndex=1;
            }
          }
        }
    }
maxWonCounts=0;
maxHandsWon=0;
    for(let i:number=0;i<3 ;i++){
      if(this.state.playersInGame[i].handsWon>maxHandsWon && winningPlayerIndex!=i )
      {
        maxHandsWon=this.state.playersInGame[i].handsWon;
        runnerupIndex=i;
      }

  }
  for(let i:number=0;i<3;i++)
  {
      if(this.state.playersInGame[i].handsWon==maxHandsWon)
      {
        maxWonCounts++;
      }
  }
  if(maxWonCounts!=1)
  {
    console.log("  winnwr /Index: "+winningPlayerIndex+"  runnerup index:"+runnerupIndex);

  this.state.playersInGame.forEach(element => {
    console.log(element.SitNo+"  -- money:"+element.myMoney);
    if(element.SitNo== winningPlayerIndex-1)
    console.log("winnwer");
    else if(element.SitNO==runnerupIndex-1)
    console.log("Runnerr");
    else
    console.log("losser");
  });
        for(let i:number=0;i<3;i++)
      {
        if(this.state.playersInGame[i].handsWon==maxHandsWon && i!=runnerupIndex && i!=winningPlayerIndex)
        {
          if(this.state.playersInGame[runnerupIndex].totalChipsWon<this.state.playersInGame[i].totalChipsWon)
          {
            runnerupIndex=1;
          }
        }
      }
  }
  console.log("  winner /Index: "+winningPlayerIndex+"  runnerup index:"+runnerupIndex);

  this.state.playersInGame.forEach(element => {
    console.log(element.SitNo+"  -- money:"+element.myMoney);
    if(element.SitNo== winningPlayerIndex-1)
    console.log("winnwer");
    else if(element.SitNO==runnerupIndex-1)
    console.log("Runnerr");
    else
    console.log("losser");
  });
  console.log("  winnwr /Index: "+winningPlayerIndex+"  runnerup index:"+runnerupIndex);

this.state.playersInGame[winningPlayerIndex].myMoney+=(this.state.currentTable.entryFees*3)/2;
this.state.playersInGame[runnerupIndex].myMoney+=((this.state.currentTable.entryFees*3)*30)/100;
console.log("  winnwr /Index: "+winningPlayerIndex+"  runnerup index:"+runnerupIndex);
this.broadcast("PricePool",{winner:winningPlayerIndex,runner:runnerupIndex});
this.clock.clear();
this.clock.start();
this.clock.setTimeout(()=>{
  this.isGameFinished=true;
  this.disconnect();
},2000);
}
DisplayHandResult()
{
  this.clock.stop();
  this.clock.start();
  this.state.currentTurnOfPlayer=1;
  this.state.playersInGame[0].currentSplitTurn=0;this.state.playersInGame[1].currentSplitTurn=0;this.state.playersInGame[2].currentSplitTurn=0;
  this.clock.setInterval(()=>{

    
    if(this.state.currentTurnOfPlayer>3){
      //logic for starting new hand
      this.clock.clear();
      this.clock.start();
      this.broadcast("RemoveDelarsCards");
      if(this.state.currentHandNo<3){
      this.state.currentHandNo++;
      this.winprobabilitycamecounter=0;
      this.CheckPlayerChips();
      this.broadcast('InitializeNewHand',{handNo:this.state.currentHandNo});
      }
      else
      {
        this.DisplayPricePool();
      }
      console.log(" Start New Hand ");
    }
    else if(this.state.playersInGame[this.state.currentTurnOfPlayer-1].isPlaying==false )
    {
      this.state.currentTurnOfPlayer++;
    }
    else if(this.state.playersInGame[this.state.currentTurnOfPlayer-1].playerHandDetails[0].isSplited==false && this.state.playersInGame[this.state.currentTurnOfPlayer-1].playerHandDetails[0].isSurrender==true)
    {
      
      this.state.currentTurnOfPlayer++;
    }
    else
    {
      console.log(" IF player is surrendered ?????"+this.state.playersInGame[this.state.currentTurnOfPlayer-1].playerHandDetails[0].isSurrender +" Splited???"+this.state.playersInGame[this.state.currentTurnOfPlayer-1].playerHandDetails[0].isSplited);

      let dPoints:number=0;
      let pPoints:number=0;

      dPoints=this.state.delar.points;
      if(this.state.playersInGame[this.state.currentTurnOfPlayer-1].playerHandDetails[0].isSplited==false)
      {
          pPoints=this.state.playersInGame[this.state.currentTurnOfPlayer-1].playerHandDetails[0].points;
          if(dPoints<22 && (dPoints>pPoints || pPoints>21 ))
          {
            //loss
                          if(dPoints==21 && this.state.playersInGame[this.state.currentTurnOfPlayer-1].playerHandDetails[0].isInsured==true )
                          {//insurance return
                            this.state.playersInGame[this.state.currentTurnOfPlayer-1].totalChipsInCurrentBet-=this.state.playersInGame[this.state.currentTurnOfPlayer-1].playerHandDetails[0].bet+(this.state.playersInGame[this.state.currentTurnOfPlayer-1].playerHandDetails[0].bet/2);
                            this.state.playersInGame[this.state.currentTurnOfPlayer-1].myChips+=this.state.playersInGame[this.state.currentTurnOfPlayer-1].playerHandDetails[0].bet+(this.state.playersInGame[this.state.currentTurnOfPlayer-1].playerHandDetails[0].bet/2);
                          }
                          this.broadcast("PlayerHandLoss",{sitno:(this.state.currentTurnOfPlayer),splitNo:(0)});
                        }
                        else if(dPoints==pPoints){
                          //push
                          if(this.state.playersInGame[this.state.currentTurnOfPlayer-1].playerHandDetails[0].isDouble==true)
                          {
                          this.state.playersInGame[this.state.currentTurnOfPlayer-1].totalChipsInCurrentBet-=this.state.playersInGame[this.state.currentTurnOfPlayer-1].playerHandDetails[0].bet;
                          this.state.playersInGame[this.state.currentTurnOfPlayer-1].myChips+=this.state.playersInGame[this.state.currentTurnOfPlayer-1].playerHandDetails[0].bet;
                          }
                          this.state.playersInGame[this.state.currentTurnOfPlayer-1].totalChipsInCurrentBet-=this.state.playersInGame[this.state.currentTurnOfPlayer-1].playerHandDetails[0].bet;
                          this.state.playersInGame[this.state.currentTurnOfPlayer-1].myChips+=this.state.playersInGame[this.state.currentTurnOfPlayer-1].playerHandDetails[0].bet;
                          this.broadcast("PlayerHandPush",{sitno:(this.state.currentTurnOfPlayer),splitNo:(0)});
                          
          }
          if(pPoints<22 && (dPoints<pPoints || dPoints>21 ))
          {
                      this.state.playersInGame[this.state.currentTurnOfPlayer-1].handsWon++;
                      if(pPoints==21)
                        {
                          this.state.playersInGame[this.state.currentTurnOfPlayer-1].totalChipsInCurrentBet=0;
                          if(this.state.playersInGame[this.state.currentTurnOfPlayer-1].playerHandDetails[0].isDouble==true){
                            this.state.playersInGame[this.state.currentTurnOfPlayer-1].totalChipsWon+=(this.state.playersInGame[this.state.currentTurnOfPlayer-1].playerHandDetails[0].bet*1.5);
                            this.state.playersInGame[this.state.currentTurnOfPlayer-1].myChips+=(this.state.playersInGame[this.state.currentTurnOfPlayer-1].playerHandDetails[0].bet*1.5)+this.state.playersInGame[this.state.currentTurnOfPlayer-1].playerHandDetails[0].bet;
                          }
                          this.state.playersInGame[this.state.currentTurnOfPlayer-1].totalChipsWon+=(this.state.playersInGame[this.state.currentTurnOfPlayer-1].playerHandDetails[0].bet*1.5);
                          this.state.playersInGame[this.state.currentTurnOfPlayer-1].myChips+=(this.state.playersInGame[this.state.currentTurnOfPlayer-1].playerHandDetails[0].bet*1.5)+this.state.playersInGame[this.state.currentTurnOfPlayer-1].playerHandDetails[0].bet;
                          this.broadcast("PlayerHandBJ",{sitno:(this.state.currentTurnOfPlayer),splitNo:(0)});
                          
                          //bj
                        }
                        else{
                        this.state.playersInGame[this.state.currentTurnOfPlayer-1].totalChipsInCurrentBet=0;
                        if(this.state.playersInGame[this.state.currentTurnOfPlayer-1].playerHandDetails[0].isDouble==true){
                          this.state.playersInGame[this.state.currentTurnOfPlayer-1].totalChipsWon+=(this.state.playersInGame[this.state.currentTurnOfPlayer-1].playerHandDetails[0].bet);
                          this.state.playersInGame[this.state.currentTurnOfPlayer-1].myChips+=(this.state.playersInGame[this.state.currentTurnOfPlayer-1].playerHandDetails[0].bet*2);
                        }
                        this.state.playersInGame[this.state.currentTurnOfPlayer-1].totalChipsWon+=(this.state.playersInGame[this.state.currentTurnOfPlayer-1].playerHandDetails[0].bet);

                          this.state.playersInGame[this.state.currentTurnOfPlayer-1].myChips+=(this.state.playersInGame[this.state.currentTurnOfPlayer-1].playerHandDetails[0].bet*2);
                          this.broadcast("PlayerHandWin",{sitno:(this.state.currentTurnOfPlayer),splitNo:(0)});
                          
                        //win
                      }
          }
          this.state.currentTurnOfPlayer++;

      }
      else
      {
        this.state.playersInGame[this.state.currentTurnOfPlayer-1].currentSplitTurn++;
        console.log(" --- "+this.state.playersInGame[this.state.currentTurnOfPlayer-1].currentSplitTurn);
        if(this.state.playersInGame[this.state.currentTurnOfPlayer-1].currentSplitTurn<3){
          if(this.state.playersInGame[this.state.currentTurnOfPlayer-1].playerHandDetails[this.state.playersInGame[this.state.currentTurnOfPlayer-1].currentSplitTurn-1].isSurrender==false)
                  {
                    pPoints=this.state.playersInGame[this.state.currentTurnOfPlayer-1].playerHandDetails[this.state.playersInGame[this.state.currentTurnOfPlayer-1].currentSplitTurn-1].points;
                    if(dPoints<22 && (dPoints>pPoints || pPoints>21 ))
                    {
                      //loss
                      if(dPoints==21 && this.state.playersInGame[this.state.currentTurnOfPlayer-1].playerHandDetails[this.state.playersInGame[this.state.currentTurnOfPlayer-1].currentSplitTurn-1].isInsured==true )
                      {//insurance return
                        this.state.playersInGame[this.state.currentTurnOfPlayer-1].totalChipsInCurrentBet-=this.state.playersInGame[this.state.currentTurnOfPlayer-1].playerHandDetails[this.state.playersInGame[this.state.currentTurnOfPlayer-1].currentSplitTurn-1].bet+(this.state.playersInGame[this.state.currentTurnOfPlayer-1].playerHandDetails[this.state.playersInGame[this.state.currentTurnOfPlayer-1].currentSplitTurn-1].bet/2);
                        this.state.playersInGame[this.state.currentTurnOfPlayer-1].myChips+=this.state.playersInGame[this.state.currentTurnOfPlayer-1].playerHandDetails[this.state.playersInGame[this.state.currentTurnOfPlayer-1].currentSplitTurn-1].bet+(this.state.playersInGame[this.state.currentTurnOfPlayer-1].playerHandDetails[this.state.playersInGame[this.state.currentTurnOfPlayer-1].currentSplitTurn-1].bet/2);
                      }
                      this.broadcast("PlayerHandLoss",{sitno:(this.state.currentTurnOfPlayer),splitNo:(this.state.playersInGame[this.state.currentTurnOfPlayer-1].currentSplitTurn)});
                    }
                    else if(dPoints==pPoints){
                      //push
                      if(this.state.playersInGame[this.state.currentTurnOfPlayer-1].playerHandDetails[this.state.playersInGame[this.state.currentTurnOfPlayer-1].currentSplitTurn-1].isDouble==true)
                      {
                      this.state.playersInGame[this.state.currentTurnOfPlayer-1].totalChipsInCurrentBet-=this.state.playersInGame[this.state.currentTurnOfPlayer-1].playerHandDetails[this.state.playersInGame[this.state.currentTurnOfPlayer-1].currentSplitTurn-1].bet;
                      this.state.playersInGame[this.state.currentTurnOfPlayer-1].myChips+=this.state.playersInGame[this.state.currentTurnOfPlayer-1].playerHandDetails[this.state.playersInGame[this.state.currentTurnOfPlayer-1].currentSplitTurn-1].bet;
                      }
                      this.state.playersInGame[this.state.currentTurnOfPlayer-1].totalChipsInCurrentBet-=this.state.playersInGame[this.state.currentTurnOfPlayer-1].playerHandDetails[this.state.playersInGame[this.state.currentTurnOfPlayer-1].currentSplitTurn-1].bet;
                      this.state.playersInGame[this.state.currentTurnOfPlayer-1].myChips+=this.state.playersInGame[this.state.currentTurnOfPlayer-1].playerHandDetails[this.state.playersInGame[this.state.currentTurnOfPlayer-1].currentSplitTurn-1].bet;
                      this.broadcast("PlayerHandPush",{sitno:(this.state.currentTurnOfPlayer),splitNo:(this.state.playersInGame[this.state.currentTurnOfPlayer-1].currentSplitTurn)});
                      
                    }
                    if(pPoints<22 && (dPoints<pPoints || dPoints>21 ))
                    {
                      this.state.playersInGame[this.state.currentTurnOfPlayer-1].handsWon++;
                      if(pPoints==21)
                        {
                          this.state.playersInGame[this.state.currentTurnOfPlayer-1].totalChipsInCurrentBet=0;
                          if(this.state.playersInGame[this.state.currentTurnOfPlayer-1].playerHandDetails[this.state.playersInGame[this.state.currentTurnOfPlayer-1].currentSplitTurn-1].isDouble==true){
                            this.state.playersInGame[this.state.currentTurnOfPlayer-1].totalChipsWon+=(this.state.playersInGame[this.state.currentTurnOfPlayer-1].playerHandDetails[0].bet*1.5);
                            this.state.playersInGame[this.state.currentTurnOfPlayer-1].myChips+=(this.state.playersInGame[this.state.currentTurnOfPlayer-1].playerHandDetails[this.state.playersInGame[this.state.currentTurnOfPlayer-1].currentSplitTurn-1].bet*1.5)+this.state.playersInGame[this.state.currentTurnOfPlayer-1].playerHandDetails[this.state.playersInGame[this.state.currentTurnOfPlayer-1].currentSplitTurn-1].bet;
                          }
                          this.state.playersInGame[this.state.currentTurnOfPlayer-1].totalChipsWon+=(this.state.playersInGame[this.state.currentTurnOfPlayer-1].playerHandDetails[0].bet*1.5);
                          this.state.playersInGame[this.state.currentTurnOfPlayer-1].myChips+=(this.state.playersInGame[this.state.currentTurnOfPlayer-1].playerHandDetails[this.state.playersInGame[this.state.currentTurnOfPlayer-1].currentSplitTurn-1].bet*1.5)+this.state.playersInGame[this.state.currentTurnOfPlayer-1].playerHandDetails[this.state.playersInGame[this.state.currentTurnOfPlayer-1].currentSplitTurn-1].bet;
                          this.broadcast("PlayerHandBJ",{sitno:(this.state.currentTurnOfPlayer),splitNo:(this.state.playersInGame[this.state.currentTurnOfPlayer-1].currentSplitTurn)});
                          
                          //bj
                        }
                        else{
                        this.state.playersInGame[this.state.currentTurnOfPlayer-1].totalChipsInCurrentBet=0;
                        if(this.state.playersInGame[this.state.currentTurnOfPlayer-1].playerHandDetails[this.state.playersInGame[this.state.currentTurnOfPlayer-1].currentSplitTurn-1].isDouble==true){
                          this.state.playersInGame[this.state.currentTurnOfPlayer-1].totalChipsWon+=(this.state.playersInGame[this.state.currentTurnOfPlayer-1].playerHandDetails[0].bet);
                          this.state.playersInGame[this.state.currentTurnOfPlayer-1].myChips+=(this.state.playersInGame[this.state.currentTurnOfPlayer-1].playerHandDetails[this.state.playersInGame[this.state.currentTurnOfPlayer-1].currentSplitTurn-1].bet*2);
                        }
                        this.state.playersInGame[this.state.currentTurnOfPlayer-1].totalChipsWon+=(this.state.playersInGame[this.state.currentTurnOfPlayer-1].playerHandDetails[0].bet);
                        this.state.playersInGame[this.state.currentTurnOfPlayer-1].myChips+=(this.state.playersInGame[this.state.currentTurnOfPlayer-1].playerHandDetails[this.state.playersInGame[this.state.currentTurnOfPlayer-1].currentSplitTurn-1].bet*2);
                          this.broadcast("PlayerHandWin",{sitno:(this.state.currentTurnOfPlayer),splitNo:(this.state.playersInGame[this.state.currentTurnOfPlayer-1].currentSplitTurn)});
                          
                        //win
                      }
                    }
                  }
              }
          else{
            this.state.currentTurnOfPlayer++;

          } 
      }
        
    }
    for(let i:number=0;i<3;i++){
    console.log(" total chips won :"+this.state.playersInGame[i].totalChipsWon+"  Hands Won:"+this.state.playersInGame[i].handsWon +" +++"+this.state.playersInGame[i].PlayerName);
    }
  },3000);
}
DelarsHandPlay(){
  this.clock.clear();
  this.clock.start();
 
  this.broadcast("RevealDelarCard");
  this.clock.setTimeout(()=>{
    this.DelarHitIntervals();
  },2000);

}
DelarHitIntervals(){
  if(this.state.delar.points>20){}
  else{
this.clock.setInterval(()=>{
if(this.state.delar.points>=17){
  this.clock.clear();
  this.clock.start();
  this.DisplayHandResult();
}
else{

  
let i:number=3;
   
  let c:PlayCard;
  let flag:boolean;
  c=new PlayCard();

  console.log("call from Delar index");
  let minPoints:number=2;
  let maxPoints:number=21;
  this.state.playersInGame.forEach(element => {
    console.log(element.playerHandDetails[0].points);
    if(element.willWin==true && element.playerHandDetails[0].points<maxPoints && element.playerHandDetails[0].points>=17){
      if(element.playerHandDetails[0].isSplited==false){
      maxPoints=element.playerHandDetails[0].points;
  //console.log(minPoints,maxPoints);
      }
      else{
        if(element.playerHandDetails[0].points<element.playerHandDetails[1].points){
          maxPoints=element.playerHandDetails[0].points;

        }else
        maxPoints=element.playerHandDetails[1].points;

      }
    }
    else if(element.willWin==false && element.playerHandDetails[0].points> minPoints && element.playerHandDetails[0].points<17)
    {
      if(element.playerHandDetails[0].isSplited==false){
      minPoints=element.playerHandDetails[0].points;
 // console.log(minPoints,maxPoints);
}
else{
  if(element.playerHandDetails[0].points<element.playerHandDetails[1].points){
    minPoints=element.playerHandDetails[1].points;

  }else
  minPoints=element.playerHandDetails[1].points;

}
    }
  });
  console.log(this.state.delar.points,minPoints,maxPoints);
  c=this.state.remainingDeck.GetRandomCardForDelar(this.state.delar.points,minPoints,maxPoints);
  this.state.delar.cards.push(c);
  let newPoints:number=0;
 // console.log(" 11111 "+newPoints);
  let acecount:number=0;
  this.state.delar.cards.forEach(element => {
//    console.log(element);
            if (element.cardPoint == 11)
            {
                acecount++;
            }
            // else
            newPoints += element.cardPoint;
        //    console.log(" 1.22222 "+newPoints+"  "+ element.cardPoint);

        
  });
  for (let i1:number = 0; i1 < acecount; i1++)
        {
            if (newPoints > 21)
            {
                newPoints -= 10;
            }
        }
  //console.log(" 22222 "+newPoints);

        this.state.delar.points=newPoints;
        let ct:number=c.cardType;
  //      console.log((i+1)+"  "+ct+" "+c.cardValue+"  "+newPoints);
 // this.broadcast("DistributeMainCard",{sitno:(i+1),points:newPoints,cType:ct,cValue:c.cardValue});
 this.broadcast("DistributeMainCard",{sitno:(i+1),points:newPoints,card:JSON.stringify(c)});
}
},1500);
  }
}
public  Hit(sitNo:number,splitno:number,isDouble:boolean=false){
  this.clock.clear();
  
  this.clock.start();

  {
    console.log(" Splitno for hit "+splitno);
  let c:PlayCard;
      let flag:boolean;
      c=new PlayCard();
      if(this.state.playersInGame[sitNo-1].willWin==1){
        flag=true;
      }
      else
        flag=false;
      console.log("call from hit");

      let newPoints:number=0;
     
      let acecount:number=0;
      if(splitno==0){
        c=this.state.remainingDeck.GetRandomCard(flag,this.state.playersInGame[sitNo-1].playerHandDetails[0].points,this.state.delar.points);
        this.state.playersInGame[sitNo-1].playerHandDetails[0].cards.push(c);
       
        this.state.playersInGame[sitNo-1].playerHandDetails[0].cards.forEach(element => {
      //    console.log(element);
                  if (element.cardPoint == 11)
                  {
                      acecount++;
                  }
                  // else
                  newPoints += element.cardPoint;
              //    console.log(" 1.22222 "+newPoints+"  "+ element.cardPoint);
  
              
        }); 
      }
      else{
      c=this.state.remainingDeck.GetRandomCard(flag,this.state.playersInGame[sitNo-1].playerHandDetails[splitno-1].points,this.state.delar.points);
      this.state.playersInGame[sitNo-1].playerHandDetails[splitno-1].cards.push(c);
      
      this.state.playersInGame[sitNo-1].playerHandDetails[splitno-1].cards.forEach(element => {
    //    console.log(element);
                if (element.cardPoint == 11)
                {
                    acecount++;
                }
                // else
                newPoints += element.cardPoint;
            //    console.log(" 1.22222 "+newPoints+"  "+ element.cardPoint);

            
      }); }
      for (let i1:number = 0; i1 < acecount; i1++)
            {
                if (newPoints > 21)
                {
                    newPoints -= 10;
                }
            }
      //console.log(" 22222 "+newPoints);
if(splitno==0){
  this.state.playersInGame[sitNo-1].playerHandDetails[0].points=newPoints;
  let ct:number=c.cardType;
  console.log("Hit  "+ (sitNo-1+1)+"  "+ct+" "+c.cardValue+"  "+newPoints);
this.broadcast("Hit",{sitno:(sitNo),points:newPoints,cType:ct,cValue:c.cardValue,splitNo:this.state.playersInGame[sitNo-1].currentSplitTurn});
if( this.state.playersInGame[sitNo-1].playerHandDetails[0].points >= 21  || isDouble==true){
this.clock.setTimeout(()=>{
 
this.GetNextTurn();
},1000);
}
else {

this.clock.setTimeout(()=>{
this.RepeatCurrentTurn();
},1000);
}

}else{
            this.state.playersInGame[sitNo-1].playerHandDetails[splitno-1].points=newPoints;
            let ct:number=c.cardType;
            console.log("Hit  "+ (sitNo-1+1)+"  "+ct+" "+c.cardValue+"  "+newPoints);
       this.broadcast("Hit",{sitno:(sitNo),points:newPoints,cType:ct,cValue:c.cardValue,splitNo:this.state.playersInGame[sitNo-1].currentSplitTurn});
       if( this.state.playersInGame[sitNo-1].playerHandDetails[splitno-1].points >= 21  || isDouble==true){
         this.clock.setTimeout(()=>{
           if(splitno==1){
             this.state.playersInGame[sitNo-1].currentSplitTurn++;
             this.RepeatCurrentTurn();}
           else {
         this.GetNextTurn();}
       },1000);
       }
       else {
         
         this.clock.setTimeout(()=>{
         this.RepeatCurrentTurn();
       },1000);
       }
          }

           
     
    }
}
Stand(sitNo:number,splitno:number){
  this.clock.clear();
  this.clock.start();
  console.log(" stand ..! "+splitno+"   "+this.state.playersInGame[sitNo-1].currentSplitTurn);
  this.broadcast("Stand",{sitno:(sitNo),splitNo:(this.state.playersInGame[sitNo-1].currentSplitTurn)});
  
  this.clock.setTimeout(()=>{
   if(splitno==1){
    this.state.playersInGame[sitNo-1].currentSplitTurn++;
    this.RepeatCurrentTurn();
   }
   else if(splitno==2 || splitno==0){this.GetNextTurn();}
  },1000);
}
Surrender(sitNo:number,splitno:number=0){
this.clock.clear();
this.clock.start();

if(splitno==0){
  this.state.playersInGame[sitNo-1].myChips+=(this.state.playersInGame[sitNo-1].playerHandDetails[0].bet)/2;
  this.state.playersInGame[sitNo-1].playerHandDetails[0].isSurrender=true;
}else{
  this.state.playersInGame[sitNo-1].myChips+=(this.state.playersInGame[sitNo-1].playerHandDetails[splitno-1].bet)/2;
  this.state.playersInGame[sitNo-1].playerHandDetails[splitno-1].isSurrender=true;
}
  this.broadcast("Surrender",{sitno:(sitNo),splitNo:(splitno)});
console.log(" surrender sent. ");

  this.clock.setTimeout(()=>{
    if(splitno==1){
  this.state.playersInGame[sitNo-1].currentSplitTurn++;
  this.RepeatCurrentTurn();
    }
    else if(splitno==0 || splitno==2)
    this.GetNextTurn();
  },1000);

}
Insure(sitNo:number)
{
  this.clock.clear();
  
this.clock.start();
  this.state.playersInGame[sitNo-1].myChips-=(this.state.playersInGame[sitNo-1].playerHandDetails[0].bet/2);
  this.state.playersInGame[sitNo-1].playerHandDetails[0].isInsured=true;
  this.state.playersInGame[sitNo-1].totalChipsInCurrentBet+=(this.state.playersInGame[sitNo-1].playerHandDetails[0].bet/2);
  this.broadcast("Insure",{sitno:(sitNo)});
  this.clock.setTimeout(()=>{
    this.RepeatCurrentTurn();
  },1000);
}

Double(sitNo:number,splitno:number=0){
this.clock.clear();

this.clock.start();

if(splitno==0){

  this.state.playersInGame[sitNo-1].myChips-=(this.state.playersInGame[sitNo-1].playerHandDetails[splitno].bet);
  this.state.playersInGame[sitNo-1].totalChipsInCurrentBet+=(this.state.playersInGame[sitNo-1].playerHandDetails[splitno].bet);
  this.state.playersInGame[sitNo-1].playerHandDetails[splitno].isDouble=true;
  this.broadcast("Double",{sitno:(sitNo),splitNo:(splitno)});
  this.Hit(sitNo,splitno,true);
  /*this.clock.setTimeout(()=>{
    this.GetNextTurn();
  },1000);*/
}else
{
  this.state.playersInGame[sitNo-1].myChips-=(this.state.playersInGame[sitNo-1].playerHandDetails[splitno-1].bet);
  this.state.playersInGame[sitNo-1].totalChipsInCurrentBet+=(this.state.playersInGame[sitNo-1].playerHandDetails[splitno-1].bet);
  this.state.playersInGame[sitNo-1].playerHandDetails[splitno-1].isDouble=true;
  this.broadcast("Double",{sitno:(sitNo),splitNo:(splitno)});
  this.Hit(sitNo,splitno,true);

}
}
Split(sitNo:number)
{
 

  this.clock.clear();
  this.clock.start();


  this.state.playersInGame[sitNo-1].myChips-=(this.state.playersInGame[sitNo-1].playerHandDetails[0].bet);
  this.state.playersInGame[sitNo-1].playerHandDetails[0].isSplited=true;
  this.state.playersInGame[sitNo-1].playerHandDetails[0].splitno=1;
  this.state.playersInGame[sitNo-1].totalChipsInCurrentBet+=(this.state.playersInGame[sitNo-1].playerHandDetails[0].bet);
 
let phd:PlayerHandData=new PlayerHandData();
  this.state.playersInGame[sitNo-1].playerHandDetails[0].points/=2;
  phd.points=this.state.playersInGame[sitNo-1].playerHandDetails[0].points;
  phd.bet=this.state.playersInGame[sitNo-1].playerHandDetails[0].bet;
  phd.cards=new ArraySchema<PlayCard>();
  phd.isDouble=this.state.playersInGame[sitNo-1].playerHandDetails[0].isDouble;
  phd.isInsured=this.state.playersInGame[sitNo-1].playerHandDetails[0].isInsured;
  phd.isSplited=true;
  phd.isSurrender=false;
  phd.splitno=2;
  let c:PlayCard;
  c=this.state.playersInGame[sitNo-1].playerHandDetails[0].cards.at(1);
  phd.cards.push(c);
  this.state.playersInGame[sitNo-1].playerHandDetails[0].cards.deleteAt(1);
  this.state.playersInGame[sitNo-1].playerHandDetails.push(phd);
  this.broadcast("Split",{sitno:(sitNo)});
  this.clock.setTimeout(()=>{
    this.DispenceSplitedCard(sitNo);
  },1500);
}
DispenceSplitedCard(sitNo:number)
{
  console.log("start Splited card distribution logic from here");
  this.clock.clear();
  
this.clock.start();


  let i:number=0;



  this.clock.setInterval(()=>{

if(i<2){
    let c:PlayCard;
    let flag:boolean;
    c=new PlayCard();
    if(this.state.playersInGame[sitNo-1].willWin==1){
      flag=true;
    }
    else
    flag=false;
    c=this.state.remainingDeck.GetRandomCard(flag,this.state.playersInGame[sitNo-1].playerHandDetails[i].points,this.state.delar.points);
    this.state.playersInGame[sitNo-1].playerHandDetails[i].cards.push(c);
    let newPoints:number=0;
   // console.log(" 11111 "+newPoints);
    let acecount:number=0;
    this.state.playersInGame[sitNo-1].playerHandDetails[i].cards.forEach(element => {
  //    console.log(element);
              if (element.cardPoint == 11)
              {
                  acecount++;
              }
              // else
              newPoints += element.cardPoint;
          //    console.log(" 1.22222 "+newPoints+"  "+ element.cardPoint);

          
    });
    for (let i1:number = 0; i1 < acecount; i1++)
          {
              if (newPoints > 21)
              {
                  newPoints -= 10;
              }
          }
    //console.log(" 22222 "+newPoints);

          this.state.playersInGame[sitNo-1].playerHandDetails[i].points=newPoints;
          let ct:number=c.cardType;
    //      console.log((i+1)+"  "+ct+" "+c.cardValue+"  "+newPoints);
    console.log("card Sent");
    this.broadcast("DistributeSplitedCard",{sitno:(sitNo),points:newPoints,cType:ct,cValue:c.cardValue,splitNo:(i+1)});
        }
        if(i==2)
        {
          this.clock.clear();
          
          this.clock.start();
          this.state.playersInGame[sitNo-1].currentSplitTurn=1;
          this.RepeatCurrentTurn();
        }
    i++;
   
  },1500);
}

public CheckPlayerChips()
{
  console.log("Chackinh for player bet  ");
  let playersPlaying:number=0;
  this.state.playersInGame.forEach(element => {
    if((element.myChips<this.state.currentTable.minBet || element.isRemoved==true)&&element.isPlaying==true)
    {
        element.isPlaying=false;
        console.log("<<<<<<<<<<<<<<<<<>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> Out of game -----: "+element.PlayerName+" "+element.isPlaying);
        this.broadcast("PlayerIsOutOfGame",{sitno:element.SitNo});
        this.winprobabilitytarget--;
    }
    else
    {
      playersPlaying++;
    }
  });
}

}
