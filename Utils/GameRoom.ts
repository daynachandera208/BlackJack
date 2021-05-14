import { Room, Client, generateId, Delayed } from "colyseus";
import { Schema, MapSchema, ArraySchema, Context } from "@colyseus/schema";
import { verifyToken, User, IUser } from "@colyseus/social";
import { DeckOfCards } from "./DeckOfCards";
import { DelarData } from "../States/DelarData";
import { GameTable } from "../States/GameTable";
import { PlayCard } from "../States/PlayCard";
import { Player } from "../States/Player";
import { PlayerHandData } from "../States/PlayerHandData";
import { State } from "../States/State";
import { flattenDiagnosticMessageText, idText } from "typescript";


// Create a context for this room's state data.
const type = Context.create();




//class for testing 
class MyMessage extends Schema {
  @type("string") message: string;
}

//Main Logic of game is here this class uses overloaded method SetTable for different table wise gameroom creation
export class GameRoom extends Room 
{
  maxClients=3; //for determination of maximum players\Bot can join room
  FixedBotIndex:number=-1;//stores index of Bot in Player's ArraySchema of state
  isBotFirstTurn:boolean=true;//used for split and double for bot's gameplay
  playercounter:number=0;//Current No. of players in Game Room
  sittingplayercounter:number=0;//No. of Player Sitted in Sit
  winprobabilitycamecounter:number=0;//Counter to track win probability of all players hase been came and it must be equal to winprobabilitytarger variabe declared below
  winprobabilitytarget:number=0;
  isGameFinished=false;// to determine game is finished or not

  SetTable()
  {//override this to create new table
    this.state.currentTable=new GameTable();
    this.state.currentTable=new GameTable();
    this.state.currentTable.minBet=10;
    this.state.currentTable.maxBet=5000;
    this.state.currentTable.handsLimit=3;
    this.state.currentTable.entryFees=5;
    this.state.currentTable.tableName="oops";
    console.log('Unwanted one - Table Created without child');
  }


  onCreate (options: any) 
  {
    //this.setPatchRate(null);// an effort fo solving Byte[] out of bound error
    console.log("Room created.", options);
    this.setState(new State());
    this.SetTable();
    this.state.playersInGame=new ArraySchema<Player>();
    //console.log(" Player Entered :::::"+this.state.playersInGame.length);

    this.clock.clear();    
    this.clock.start();
    this.state.deck=new DeckOfCards();
    this.state.remainingDeck=new DeckOfCards();
    this.state.deck.SuffleDeck();
    this.state.currentGameState="roomCreated";
    this.setMetadata({
      str: "hello",
      number: 10
    });

    this.setPatchRate(1000 / 20); //Don't Comment this , it will result in stopping all timely wvents
    /*this.setSimulationInterval((dt) => this.update(dt));

    this.onMessage(0, (client, message) => {
      client.send(0, message);
    });*/

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
    //here client's data are stored in player's arrayschema of state
    this.onMessage("MyIntro",(client,p)=>{
      console.log("Intro");
      if(this.playercounter==0)
      {//first player start bot timer to enter game
        this.SetBotTimeOut();
      }
      this.playercounter++;
      this.winprobabilitytarget++;
      //storing playes data to stae's plaesingame arrayschema
      //console.log(this.playercounter-1+" --- Playercounter");
      //console.log("p="+p.myMoney);
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
      //console.log(" Player Entered :::::"+this.state.playersInGame.length);
      this.state.playersInGame.push(player );
      //console.log(" Player Entered :::::"+this.state.playersInGame.length);
      this.SetPlayerSittingTimeOut(this.playercounter-1);
      //console.log("Player Enterd "+this.state.playersInGame.at(0)+"---"+this.state.playersInGame.at(0).sessionId);
      if(this.playercounter==3)
      {//All Players Came Start The Game
        this.lock();
        this.StartGame();
      }
    });
    //request from client side to let sit player on requested sit
    this.onMessage("SitInChair",(client,sit)=>{
      this.state.playersInGame.forEach(element => {
        if(element.sessionId==client.sessionId)
        {
          let flag:boolean=true;
          this.state.playersInGame.forEach(element1 => {//checking is reqested sit is empty?
            if(element1.SitNo==sit)
            {
              flag=false;
            }
          });
          if(flag)
          {//got empty sit,Place Player on that sit
            element.SitNo=sit;
            console.log("sit---"+sit+" -- "+element);
            let p:Player;
            p=new Player();
            p=element;
            console.log("p="+p);
            this.sittingplayercounter++;
            //console.log("Player ManualSit "+element+" "+element.SitNo+"  " +element.PlayerName+"+  +"+sit+" e"+ element.SitNo);
            let tmp:ArraySchema<Player>;
            tmp=new ArraySchema<Player>();
            tmp.push(element);
            this.broadcast("PlayerSitted",{sitno:sit,player:JSON.stringify(element)});
          }
        }
      });
    });
    //setting up winning Probability to true or false accrding to client
    this.onMessage("SetMyCurrentWinProbability",(client,winprobability)=>{
      //console.log("<><<<>>>>>>>"+this.state.playersInGame.length);
      this.state.playersInGame.forEach(element => {
      //console.log(" "+ client.sessionId+"<><><><>"+element.sessionId);
        if(element.sessionId==client.sessionId)
        {
          //console.log("MY Win Probability--"+element.SitNo);

          if(winprobability)
            element.willWin=1;
        
          else
            element.willWin=0;
        
          this.winprobabilitycamecounter++;
        }
      });
      //console.log(this.winprobabilitycamecounter+"   --- "+this.winprobabilitytarget+" Players "+ this.state.playersInGame.length);
      if(this.winprobabilitycamecounter==this.winprobabilitytarget)
      {//does fulfilled all probabilities than start game
        this.StartHand();
      }
    });
    //Hit Request by Player
    this.onMessage("HitRequest",(client,splitNo)=>{

      this.Hit(this.state.currentTurnOfPlayer,splitNo);

    });
    //Double Request by Player
    this.onMessage("DoubleRequest",(client,splitNo)=>{

      this.Double(this.state.currentTurnOfPlayer,splitNo);
      
    });
    //Surrender Request By Player
    this.onMessage("SurrenderRequest",(client,splitNo)=>{

      this.Surrender(this.state.currentTurnOfPlayer,splitNo);
      //console.log(" surrender rteq. ");
    });
    //Stand Request
    this.onMessage("StandRequest",(client,splitNo)=>{

      this.Stand(this.state.currentTurnOfPlayer,splitNo);
  
    });
    //Send Player Table Data at load time
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
      tables[2].maxBet=500000;
      tables[2].handsLimit=7;
      tables[2].entryFees=15;
      tables[2].tableName="casinos";
      client.send("TableDetails",{data:tables});
    });


    //Insure Request by Player
    this.onMessage("InsureRequest",(client,splitNo)=>{

      this.Insure(this.state.currentTurnOfPlayer);
    
    });
    
    
    //Split Request by Player
    this.onMessage("SplitRequest",(client,splitNo)=>{

      this.Split(this.state.currentTurnOfPlayer);
      
    });
    

    //Initial bet made by Player
    this.onMessage("InitialBetByPlayer",(client,betamt)=>{
      let flag:boolean=true;
      //finding and assigning bet ammount to Player's arrayschema in State
      this.state.playersInGame.forEach(element => {
        if(element.sessionId==client.sessionId)
        {
          element.playerHandDetails[0].bet=betamt;
          element.lastbet=betamt;
          element.totalChipsInCurrentBet+=betamt;
          element.myChips-=betamt;
          //console.log("Request by player Index-"+element.SitNo);

          this.broadcast("SetInitialBet",{bet:betamt,sitno:element.SitNo});
        }
        if(element.playerHandDetails.at(0).bet==0)
        //Checking for all players bet if any one is left to bet than nothing happne other vise card distribution 
          flag=false;
      });
      if(flag)
      {
        //start card distribution from here
        this.DistributrInitailCards();

      }
    });

    //default receiver for loggiong incoming messages
    this.onMessage("*", (client, type, message) => {
      console.log(`received message "${type}" from ${client.sessionId}:`, message);
    });
  }

  async onAuth (client, options) 
  {//returning true for sake of JWT not included error 
    //console.log("onAuth(), options!", options);
    //return await User.findById(verifyToken(options.token)._id);
    return true;
  }

  //Player joint the Gameroom
  onJoin (client: Client, options: any, user: IUser) 
  {
    this.state.currentGameState="WaitingForPlayers";
    //console.log("client joined!", client.sessionId);
    client.send("GiveIntro");//requesting client for introduction data
    //client.send("TestCode",{tc:this.state});
    //this.state.entities[client.sessionId] = new Player();
    console.log("Player Counter="+this.playercounter);
    //sending previously Entered Players to late joint players
    if(this.playercounter==0)
    {
      client.send("PlayersInGame",{playerCount:this.playercounter,player1Data:null,player2Data:null});
    }
    else if(this.playercounter==1)
    {
      //client.send("PlayersInGame",{playerCount:0,playerData:null});
      //console.log(this.state.playersInGame.at(0));
      client.send("PlayersInGame",{playerCount:this.playercounter,player1Data:JSON.stringify(this.state.playersInGame.at(0)),player2Data:null});
    }
    else
    {
      //console.log(this.state.playersInGame.at(0)+"--"+this.state.playersInGame.at(1));
      client.send("PlayersInGame",{playerCount:this.playercounter,player1Data:JSON.stringify(this.state.playersInGame.at(0)),player2Data:JSON.stringify(this.state.playersInGame.at(1))});
    }
  }
  //Player left Room
  async onLeave (client: Client, consented: boolean) 
  {
    //this.state.entities[client.sessionId].connected = false;
    if(consented == true)
    {
      console.log(`Player has self disconnaction`);
      this.ReconnectFailedForPlayer(client.sessionId);
    }
    else
    {
                  console.log('Room Left by Client:'+client.sessionId);
                  if(this.isGameFinished==true)
                  {
                    //send final data to save;
                    this.state.playersInGame.forEach(element => {
                      if(element.isConnected==true)
                      {
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
                          this.ReconnectFailedForPlayer(client.sessionId);
                      }
                      else {
                        console.log("Waiting for client ");
                        this.setPlayerConnected(client.sessionId, false);
                        await this.allowReconnection(client, 120 );
                        this.setPlayerConnected(client.sessionId, true);
                        console.log(`Client with sessionId ${client.sessionId} successfully reconnected!!`);
                      }

                  } catch (e) {
                      console.log(`Player has not reconnected, removing from Room`);
                      this.ReconnectFailedForPlayer(client.sessionId);
                      
                  }
                }
    }
   
  }


  //Method used to change Player from left to rejoined
  setPlayerConnected(sessionId: string, value: boolean)
  {
      this.state.playersInGame.forEach(element => {
        if(element.sessionId==sessionId)
        {
            element.isConnected=value;
            console.log("player disconnected :"+element.isConnected+" named: "+element.PlayerName);
        }
      });
  }

  onDispose () {
    console.log("DemoRoom disposed.");
  }

  //this method has timer after it is over bot spans as new Player
  SetBotTimeOut()
  {
    console.log("Bot is comming");
    this.clock.setTimeout(()=>{
    console.log("Bot is comming");
      if(this.playercounter<3)
      {//not enough players add new bot
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
        //console.log(this.playercounter-1+" --- -- ");//+this.state.playersInGame[this.playercounter-1]);
        // this.state.playersInGame[this.playercounter-1]=new Player();
        this.state.playersInGame.push(p);

        //if(this.state.playersInGame.at(this.playercounter-1).SitNo==0)
        {
          for(let i:number=1;i<4;i++)
          {
                let flag:boolean;
                flag=true;
                //checking if any  empty sit is there 
                this.state.playersInGame.forEach(element => {
                if(element.SitNo==i){
                flag=false;
                }
              });
              if(flag)
              {
                //siting last Player(Bot) to empty sit and sending broad cast to all
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
        if(this.playercounter==3)
        {//all Players Came Start The GamePlay(Initial Bet)
          this.lock();
          this.StartGame();
        }
      }
    },10000);
  }

  //this method is used for auto sitting players after time limit is over and player have not sited yet
  SetPlayerSittingTimeOut(PlayerIndex:number){
    this.clock.setTimeout(()=>{
      //after 5 second players will be auto sitted
      //console.log(PlayerIndex+" -- "+ this.state.playersInGame[PlayerIndex]);
      if(this.state.playersInGame.at(PlayerIndex).SitNo==0)
      {
        for(let i:number=1;i<4;i++)
        {//checking for empty sit
          let flag:boolean;
          flag=true;
        
          this.state.playersInGame.forEach(element => {
            if(element.SitNo==i){
            flag=false;
            }
          });
          if(flag)
          {//sat player on empty Sit
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


  //this method is used for initial starting of game (1st hand of game brodcasted from here) after it Server will wait till all player give There winprobability than StartHand() Will be invoked
  StartGame()
  {
    //console.log("<><><"+this.state.playersInGame.length);
    //Auto sitting Standing Players after all Players connnected to room
    this.state.WinnerIndex=-1;
    this.state.RunnerupIndex=-1;
    if(this.sittingplayercounter<3)
    {
      this.state.playersInGame.forEach(element => {
        if(element.SitNo==0)
        { // is Players not sited
          for(let i:number=1;i<4;i++)
          {//finding empty sit
            let flag:boolean;
            flag=true;
            this.state.playersInGame.forEach(element1 => {
              if(element1.SitNo==i){
                flag=false;
              }
            });
            if(flag)
            {//sitting Player on empty sit
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
    this.state.currentGameState="gameStartingForFirstTime";
    //console.log("Start Game Logic From Here"+this.state.playersInGame.length);
    //sorting Players array according to sit No so on 0th position player sit will be 1 ...
    let tmp:ArraySchema<Player>=new ArraySchema<Player>();
    for(let i:number=1;i<4;i++)
    {
      this.state.playersInGame.forEach(element => {
        if(element.SitNo==i)
        {
          //console.log(" Let's see "+element.SitNo+"  sit is "+element.isBot);
          if(element.isBot)
          {//assing fixedbotIndex with index of bot in arrayschema
            this.FixedBotIndex=i-1;
            //console.log("we got bot "+element.SitNo+"  sit is "+element.isBot+" at index "+this.FixedBotIndex);
          }
          //assigning Sorted values to Tmp temparor arrayschema
          tmp.push(element);
        }
      });
    }
    this.state.playersInGame=new ArraySchema<Player>();
    tmp.forEach(element => {//assigning sorted players to original arrayschema
     
      this.state.playersInGame.push(element);
    });

    //deducting Entry Feees from all Players
    this.state.playersInGame.forEach(element => {
      element.myMoney-=this.state.currentTable.entryFees;
    });
    //console.log(this.state.playersInGame.length+"-<->-");
    
    //starting first Hand of Game
    this.state.currentHandNo=1;
    this.CheckPlayerChips();
    this.broadcast('InitializeNewHand',{handNo:this.state.currentHandNo});
    this.clock.setTimeout(()=>{//logic to add win probability after 1 seconds and starting new hand (useful when one of player is out of game and yet to reconnect)
      console.log("probability came counter="+this.winprobabilitycamecounter+" target="+this.winprobabilitytarget);
      if(this.winprobabilitycamecounter!=this.winprobabilitytarget)
      {
        this.state.playersInGame.forEach(element => {
          if(element.isBot==false)
          {
            if(Math.random()>0.6)
             element.winprobability=1;
            else
             element.winprobability=0;
          }
          else
          {
            if(Math.random()<0.6)
             element.winprobability=1;
            else
             element.winprobability=0;
          }
        });
        this.StartHand();
      }
      console.log("starting new hand from server win probability");
    },1000);
    //console.log("initalizing new hand"+this.state.playersInGame.length);
    
  }

  //invoked after geting all win probabilities this methid invokes , it will initialize all hand deta for ever players and than will start bet for current hand and after timeout or all bet placed cards will be distributed
  public StartHand()
  {
    if(this.FixedBotIndex!=-1)
    {//there is bot in game let's first set bots win probability
      let probability:number=Math.floor(Math.random() * 10);
      if(probability>4)
      {
        this.state.playersInGame.at(this.FixedBotIndex).willWin=1;
      }
      else
        this.state.playersInGame.at(this.FixedBotIndex).willWin=0;

      //console.log("Bot Win Probability ..:"+this.state.playersInGame.at(this.FixedBotIndex).willWin)
      
    }
    for(let i:number=0;i<3;i++)
    {//initialization on player's hand data for new hand
      //console.log(" playerhands data initialized for sit no + "+(i+1));
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

    //initializing delar's data
    this.state.delar=new DelarData();
    this.state.delar.cards=new ArraySchema<PlayCard>();
    this.state.delar.points=0;
    this.state.delar=new DelarData();
    this.state.delar.points=0;
    this.state.delar.cards=new ArraySchema<PlayCard>();
    this.broadcast("StartNewHand",{player1:JSON.stringify(this.state.playersInGame[0].playerHandDetails[0]),player2:JSON.stringify(this.state.playersInGame[1].playerHandDetails[0]),player3:JSON.stringify(this.state.playersInGame[2].playerHandDetails[0])});
    this.state.currentGameState="InitialBettingTime";
    if(this.FixedBotIndex!=-1 && this.state.playersInGame[this.FixedBotIndex].isPlaying)
    { //if Bot is Playing In Game Than Set It's random bet at random time 
      
      
      this.clock.setTimeout(()=>{
        //gatting bet random  ammount from possible 6 bet ammount of tables
        let tmp:number= Math.floor(Math.random() * 6);
        let betamt:number=this.state.currentTable.minBet;


        for(let  j:number=2;j<=tmp;j++)
        {//incrementing Bet ammount accordnig to tabels bet options
                let newBetAmt:number=0;
                if(j%2==0)
                {
                  newBetAmt=betamt*5;
                }
                else
                {
                  newBetAmt= betamt*2;
                }
                if(newBetAmt>this.state.playersInGame[this.FixedBotIndex].myChips)
                {//bot has less chips than break and give samllest bet else continue
                  break;
                }
                else
                {
                  betamt=newBetAmt;
                }
        }

        //logic for deducting bet ammount and setting up hand data for bot
        this.state.playersInGame[this.FixedBotIndex].playerHandDetails[0].bet=betamt;
        this.state.playersInGame[this.FixedBotIndex].myChips-=betamt;
        this.isBotFirstTurn=true;

        this.broadcast("SetInitialBet",{bet:betamt,sitno:this.FixedBotIndex+1});

        //checking for all Players bet if all players has puted bet than start logic for distribution of cards
        let flag:boolean=true;
        for(let i:number=0;i<3;i++)
        {
          if(this.state.playersInGame[i].playerHandDetails[0].bet==0)
            flag=false;
        }
        if(flag)
        {
          //start card distribution from here
          this.DistributrInitailCards();
        }
        for(let i:number=0;i<3;i++)
        {
          if(this.state.playersInGame[i].isConnected==false && this.state.playersInGame[i].isPlaying )
          {//checking if player is playing and not have selected bet than auto beting minimum bet for them
            this.state.playersInGame[i].playerHandDetails[0].bet=this.state.currentTable.minBet;
            this.broadcast("SetInitialBet",{bet:this.state.currentTable.minBet,sitno:(i+1)});
          }
        }
      },Math.floor(Math.random() * (7000 - 3000 + 1) + 3000));//this will set bot bet at random time between 3 to 7 seconds
    }
    this.state.currentSecondsSpentInTurn=0;
      this.clock.setInterval(()=>{
        this.state.currentSecondsSpentInTurn++;
        //this.broadcast("TurnTick",{turnOfPlayer:this.state.currentTurnOfPlayer,timeSpent:this.state.currentSecondsSpentInTurn});
      },1000);
    //logic for setting minimum bet for player after time out of 10 seconds
    this.clock.setTimeout(()=>{
      for(let i:number=0;i<3;i++)
      {
        if(this.state.playersInGame[i].playerHandDetails[0].bet==0 && this.state.playersInGame[i].isPlaying )
        {//checking if player is playing and not have selected bet than auto beting minimum bet for them
          this.state.playersInGame[i].playerHandDetails[0].bet=this.state.currentTable.minBet;
          this.broadcast("SetInitialBet",{bet:this.state.currentTable.minBet,sitno:(i+1)});
        }
      }

      //after it start cards distribution
      this.DistributrInitailCards();
    },10000);
    
  }



  //this method called after  all players have set there bet for current hand initail card distribution starts
  public DistributrInitailCards()
  {
    this.state.currentGameState="cardsDistribution";
    //console.log("start card distribution logic from here");
    this.clock.clear();//for sake of infinitie loops in GetCard();
    this.clock.start();
    //initializing new card deck for current hand
    this.state.remainingDeck=new DeckOfCards();
    this.state.remainingDeck.CopyCard(this.state.deck.cardsOfDeck);
    let i:number=0;

    //setting up interval betwnnew each cards being distributed
    this.clock.setInterval(()=>{

      if(i<3){//Means Player's Cards to be distributed
      
        if(this.state.playersInGame[i].isPlaying==true && this.state.playersInGame[i].isRemoved==false)
        {//if player is in game


              //initialization of variables
              let c:PlayCard;
              let flag:boolean;
              c=new PlayCard();
              if(this.state.playersInGame[i].willWin==1){
                flag=true;
              }
              else
                flag=false;
              

              //getting card and storing it; accroding to win probability and card points
              c=this.state.remainingDeck.GetRandomCard(flag,this.state.playersInGame[i].playerHandDetails[0].points,this.state.delar.points);
              this.state.playersInGame[i].playerHandDetails[0].cards.push(c);

              //calculating new points according to new card
              let newPoints:number=0;
              let acecount:number=0;
              this.state.playersInGame[i].playerHandDetails[0].cards.forEach(element => {
                  if (element.cardPoint == 11)
                  {
                      acecount++;
                  }
                  // adding points accordingly
                  newPoints += element.cardPoint;
              });
              for (let i1:number = 0; i1 < acecount; i1++)
              {//according to aces and point set new values so burst not happens with ace
                  if (newPoints > 21)
                  {
                      newPoints -= 10;
                  }
              }

              //storing and broadcasting new card for player
              this.state.playersInGame[i].playerHandDetails[0].points=newPoints;
              let ct:number=c.cardType;
              this.broadcast("DistributeMainCard",{sitno:(i+1),points:newPoints,card:JSON.stringify(c)});
        } 
      }
      else if(i==3) //Meanse Delars Card
      {
        //initailaization
        let c:PlayCard;
        let flag:boolean;
        c=new PlayCard();
    
        //setting up limits for getting delars card according to player's winprobability
        let minPoints:number=2;
        let maxPoints:number=21;
        this.state.playersInGame.forEach(element => { //getting min and max points from all players regarding to there win probability
          if(element.willWin==true && element.playerHandDetails[0].points<maxPoints)
          {
            maxPoints=element.playerHandDetails[0].points;
          }
          else if(element.willWin==false && element.playerHandDetails[0].points> minPoints)
          {
            minPoints=element.playerHandDetails[0].points;
          }
        });

        //getting new card for delar and count points fofr delar
        c=this.state.remainingDeck.GetRandomCardForDelar(this.state.delar.points,minPoints,maxPoints);+
        this.state.delar.cards.push(c);
        let newPoints:number=0;
        let acecount:number=0;
        this.state.delar.cards.forEach(element => {
                if (element.cardPoint == 11)
                {
                    acecount++;
                }
                newPoints += element.cardPoint;
        });
        for (let i1:number = 0; i1 < acecount; i1++)
        {
                if (newPoints > 21)
                {
                    newPoints -= 10;
                }
        }
        
        //card broadcasting to all and storing points to Delars Data in stae
        this.state.delar.points=newPoints;
        let ct:number=c.cardType;
        this.broadcast("DistributeMainCard",{sitno:(i+1),points:newPoints,card:JSON.stringify(c)});
        console.log(" Delar Cards"+this.state.delar.cards.length);
        
        if(this.state.delar.cards.length==2)
        {//if all cards are distributed than start turn of player having sit 1
                this.state.currentTurnOfPlayer=0;
                this.clock.clear();
                this.clock.start();
                this.GetNextTurn();  
        }i=-1;
      }
      i++;
    },1000);
  }



  //this methos is responsible for starting next turn of player (Split code is not included here)
  public GetNextTurn()
  {
    this.state.currentGameState="PlayersTurn";
    this.clock.clear();
    this.clock.start();

    //incrementing turn mgmt variable
    this.state.currentTurnOfPlayer++;
    this.state.isFirstTurnForCurrentPlayer=true;//for Autoplay and reconnection handling
    console.log("isFirstTurnForCurrentPlayer trued"+this.state.isFirstTurnForCurrentPlayer);

    console.log("Get Next Turn..!"+this.state.isFirstTurnForCurrentPlayer);
    if(this.state.currentTurnOfPlayer>3)
    {//if turn of sit 4 than start logic for delar's autoplay
      console.log("DelarsTurn Strats Here");
      this.DelarsHandPlay();
    }
    else if(this.state.playersInGame[this.state.currentTurnOfPlayer-1].isPlaying==false || this.state.playersInGame[this.state.currentTurnOfPlayer-1].isRemoved==true )
    {//if that player is out of game than get next turn
      this.GetNextTurn();
    }
    else if(this.state.currentTurnOfPlayer<4)
    {
        if(this.state.playersInGame[this.state.currentTurnOfPlayer-1].currentSplitTurn==0)
        {
            if(this.state.playersInGame[this.state.currentTurnOfPlayer-1].playerHandDetails[0].points>=21 )
            {//if player has blackjack or bust and no splits than get next Turn
              this.GetNextTurn();
            }
        }
        else
        {
            if(this.state.playersInGame[this.state.currentTurnOfPlayer-1].playerHandDetails[this.state.playersInGame[this.state.currentTurnOfPlayer-1].currentSplitTurn-1].points>=21 )
            {//if player has blackjack or bust and splits than check for next split turn or next player turn
              if(this.state.playersInGame[this.state.currentTurnOfPlayer-1].currentSplitTurn==1)//next Split turn
              {
                this.state.playersInGame[this.state.currentTurnOfPlayer-1].currentSplitTurn++;
                this.state.isFirstTurnForCurrentPlayer=true;
                console.log("isFirstTurnForCurrentPlayer trued"+this.state.isFirstTurnForCurrentPlayer);

                this.RepeatCurrentTurn();
              }
              else
              {//next player turn
                this.GetNextTurn();
              }
            }
        }
        if(this.state.playersInGame[this.state.currentTurnOfPlayer-1].isBot==true)
        {//if turn of bot than invoke bot's turn logic and also 10 sec. auto stand 
          this.FixBotTurn();
          console.log("Get Next Turn..! boradcased:"+this.state.isFirstTurnForCurrentPlayer);
          this.broadcast("StartNewTurn",{turnOfPlayer:this.state.currentTurnOfPlayer,splitNo:this.state.playersInGame[this.state.currentTurnOfPlayer-1].currentSplitTurn,isFirstTurn:this.state.isFirstTurnForCurrentPlayer});
          console.log("Get Next Turn..! boradcased:"+this.state.isFirstTurnForCurrentPlayer);
          this.clock.setTimeout(()=>{
            this.Stand(this.state.currentTurnOfPlayer,0);
          },10000);
          this.state.currentSecondsSpentInTurn=0;
          this.clock.setInterval(()=>{
            this.state.currentSecondsSpentInTurn++;
            //this.broadcast("TurnTick",{turnOfPlayer:this.state.currentTurnOfPlayer,timeSpent:this.state.currentSecondsSpentInTurn});
          },1000);
        }
        else
        {//normal player turn listen to req. or after 10 sec. sutostand
         
          this.clock.setTimeout(()=>{
            if(this.state.playersInGame[this.state.currentTurnOfPlayer-1].isConnected==false)
            {
              this.PlayersDecisionTakingBot(this.state.currentTurnOfPlayer,true);
            }
            else
            {
              this.Stand(this.state.currentTurnOfPlayer,this.state.playersInGame[this.state.currentTurnOfPlayer-1].currentSplitTurn);
            }
          },10000);
          console.log("Turn of Player :"+this.state.playersInGame[this.state.currentTurnOfPlayer-1].PlayerName+" :isconnected : "+this.state.playersInGame[this.state.currentTurnOfPlayer-1].isConnected);
         // if(this.state.playersInGame[this.state.currentTurnOfPlayer-1].isConnected==false)
          {
          console.log("BotTurn for Player :"+this.state.playersInGame[this.state.currentTurnOfPlayer-1].PlayerName+" :isconnected : "+this.state.playersInGame[this.state.currentTurnOfPlayer-1].isConnected);
            this.PlayersDecisionTakingBot(this.state.currentTurnOfPlayer);
          }
          console.log("Get Next Turn..! boradcased:"+this.state.isFirstTurnForCurrentPlayer);
          this.broadcast("StartNewTurn",{turnOfPlayer:this.state.currentTurnOfPlayer,splitNo:this.state.playersInGame[this.state.currentTurnOfPlayer-1].currentSplitTurn,isFirstTurn:this.state.isFirstTurnForCurrentPlayer});
          console.log("Get Next Turn..! boradcased:"+this.state.isFirstTurnForCurrentPlayer);

          this.state.currentSecondsSpentInTurn=0;
          this.clock.setInterval(()=>{
            this.state.currentSecondsSpentInTurn++;
            //this.broadcast("TurnTick",{turnOfPlayer:this.state.currentTurnOfPlayer,timeSpent:this.state.currentSecondsSpentInTurn});
          },1000);
        }
    }
  }




  //this method is used when Player has new turn (meas hit without bursting or splitting )
  public RepeatCurrentTurn()
  {
    this.state.currentGameState="PlayersTurn";

        this.clock.clear();
        this.clock.start();
        if(this.state.playersInGame[this.state.currentTurnOfPlayer-1].isRemoved==true)
        {
          this.GetNextTurn();
          return;
        }
        if(this.state.playersInGame[this.state.currentTurnOfPlayer-1].currentSplitTurn==0)
        {
            if(this.state.playersInGame[this.state.currentTurnOfPlayer-1].playerHandDetails[0].points>=21 )
            {//if player has blackjack or bust and no splits than get next Turn
              this.GetNextTurn();
              return;
            }
        }
        else
        {
            if(this.state.playersInGame[this.state.currentTurnOfPlayer-1].playerHandDetails[this.state.playersInGame[this.state.currentTurnOfPlayer-1].currentSplitTurn-1].points>=21 )
            {//if player has blackjack or bust and splits than check for next split turn or next player turn
              if(this.state.playersInGame[this.state.currentTurnOfPlayer-1].currentSplitTurn==1)//next Split turn
              {
                this.state.playersInGame[this.state.currentTurnOfPlayer-1].currentSplitTurn++;
                this.state.isFirstTurnForCurrentPlayer=true;
                console.log("isFirstTurnForCurrentPlayer trued"+this.state.isFirstTurnForCurrentPlayer);
                this.RepeatCurrentTurn();
              }
              else
              {//next player turn
                this.GetNextTurn();
              }
              return;
            }
        }
    if(this.state.playersInGame[this.state.currentTurnOfPlayer-1].isBot==true)
    {// Bot's turn and 10 sec. autostand
      this.FixBotTurn();
      this.clock.setTimeout(()=>{
        this.Stand(this.state.currentTurnOfPlayer,this.state.playersInGame[this.state.currentTurnOfPlayer-1].currentSplitTurn);
      },10000);
      console.log("Get Next Turn..! boradcased:"+this.state.isFirstTurnForCurrentPlayer);
      this.broadcast("StartNewTurn",{turnOfPlayer:this.state.currentTurnOfPlayer,splitNo:this.state.playersInGame[this.state.currentTurnOfPlayer-1].currentSplitTurn,isFirstTurn:this.state.isFirstTurnForCurrentPlayer});
      console.log("Get Next Turn..! boradcased:"+this.state.isFirstTurnForCurrentPlayer);
      this.state.currentSecondsSpentInTurn=0;
      this.clock.setInterval(()=>{
        this.state.currentSecondsSpentInTurn++;
        //this.broadcast("TurnTick",{turnOfPlayer:this.state.currentTurnOfPlayer,timeSpent:this.state.currentSecondsSpentInTurn});
      },1000);
    }
    else
    {//Player's turn and 10 sec. atostand
      this.clock.setTimeout(()=>{
        if(this.state.playersInGame[this.state.currentTurnOfPlayer-1].isConnected==false)
        {
          this.PlayersDecisionTakingBot(this.state.currentTurnOfPlayer,true);
        }
        else
        {
          this.Stand(this.state.currentTurnOfPlayer,this.state.playersInGame[this.state.currentTurnOfPlayer-1].currentSplitTurn);
        }
      },10000);
      //if(this.state.playersInGame[this.state.currentTurnOfPlayer-1].isConnected==false)
      {
        this.PlayersDecisionTakingBot(this.state.currentTurnOfPlayer);
      }
      console.log("Get Next Turn..! boradcased:"+this.state.isFirstTurnForCurrentPlayer);

      this.broadcast("StartNewTurn",{turnOfPlayer:this.state.currentTurnOfPlayer,splitNo:this.state.playersInGame[this.state.currentTurnOfPlayer-1].currentSplitTurn,isFirstTurn:this.state.isFirstTurnForCurrentPlayer});
      console.log("Get Next Turn..! boradcased:"+this.state.isFirstTurnForCurrentPlayer);
      this.state.currentSecondsSpentInTurn=0;
      this.clock.setInterval(()=>{
        this.state.currentSecondsSpentInTurn++;
        //this.broadcast("TurnTick",{turnOfPlayer:this.state.currentTurnOfPlayer,timeSpent:this.state.currentSecondsSpentInTurn});
      },1000);
    }
  }


  //this method has logic for autoplay for fixed bot 
  FixBotTurn()
  {
    let splitNo:number=this.state.playersInGame[this.state.currentTurnOfPlayer-1].currentSplitTurn;
    // this.clock.clear();
    // this.clock.start();
    if(splitNo==0)
    {//Bot don't have any Splits


      if(this.state.playersInGame[this.FixedBotIndex].willWin==false)
      {//bot is going to loss
        if(Math.random()>0.3)
        {
          // hit after random time
          this.clock.setTimeout(()=>{
            this.Hit(this.state.currentTurnOfPlayer,splitNo);
      
          },Math.floor(Math.random() * (7000 - 3000 + 1) + 3000));
        }
        else
        {
          //stand after random time
          this.clock.setTimeout(()=>{
            this.Stand(this.state.currentTurnOfPlayer,splitNo);
      
          },Math.floor(Math.random() * (7000 - 3000 + 1) + 3000));
        }
      }
      else 
      {//bot is going to win


        if(this.state.playersInGame[this.FixedBotIndex].playerHandDetails[0].cards.at(0).cardPoint==this.state.playersInGame[this.FixedBotIndex].playerHandDetails[0].cards.at(1).cardPoint && this.isBotFirstTurn==true)
        {//Bot has Option to Split
          if(this.state.playersInGame[this.FixedBotIndex].playerHandDetails[0].cards.at(0).cardPoint==10)
          {
            //stand at random time because high win chances
            this.clock.setTimeout(()=>{
              this.Stand(this.state.currentTurnOfPlayer,splitNo);
      
            },Math.floor(Math.random() * (7000 - 3000 + 1) + 3000));
          }
          else if(this.state.playersInGame[this.FixedBotIndex].playerHandDetails[0].cards.cardPoint>7 )//|| this.state.playersInGame[this.FixedBotIndex].playerHandDetails[0].cards.at(0).cardPoint==11 || this.state.playersInGame[this.FixedBotIndex].playerHandDetails[0].cards.at(0).cardPoint>=this.state.delar.cards.at(0).cardPoint)
          {
            //Split logic because high chnaces to earn more chips
            this.clock.setTimeout(()=>{
              this.Split(this.state.currentTurnOfPlayer);
      
            },Math.floor(Math.random() * (7000 - 3000 + 1) + 3000));
          }
          
        }
        if((this.state.playersInGame[this.FixedBotIndex].playerHandDetails[0].points>11 && this.state.playersInGame[this.FixedBotIndex].playerHandDetails[0].points <=16) && this.isBotFirstTurn==true)
        { 
          if(Math.random()>0.7){
            //Double because bot stand chance to win by one hit(double; more chips to win)
            this.clock.setTimeout(()=>{
              this.Double(this.state.currentTurnOfPlayer,splitNo);
      
            },Math.floor(Math.random() * (7000 - 3000 + 1) + 3000));

          }
        }
        if(this.state.playersInGame[this.FixedBotIndex].playerHandDetails[0].points<18)
        {
        //hit untill point reaches 18 or high for winning chance
          this.clock.setTimeout(()=>{
            this.Hit(this.state.currentTurnOfPlayer,splitNo);
      
          },Math.floor(Math.random() * (7000 - 3000 + 1) + 3000));
        
        }
        else
        {
          //stand when reached 18 or more points to avoid burst
          this.clock.setTimeout(()=>{
            this.Stand(this.state.currentTurnOfPlayer,splitNo);
      
          },Math.floor(Math.random() * (7000 - 3000 + 1) + 3000));
        }
      }
    }
    else
    {// Bot is having Splited cards
          if((this.state.playersInGame[this.FixedBotIndex].playerHandDetails[splitNo-1].points>11 && this.state.playersInGame[this.FixedBotIndex].playerHandDetails[splitNo-1].points <=16) && this.isBotFirstTurn==true)
          { 
            if(Math.random()>0.7)
            {
              //Double 
              this.clock.setTimeout(()=>{
                this.Double(this.state.currentTurnOfPlayer,splitNo);
      
              },Math.floor(Math.random() * (7000 - 3000 + 1) + 3000));

            }
          }
          if(this.state.playersInGame[this.FixedBotIndex].playerHandDetails[splitNo-1].points<18)
          {
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
    this.isBotFirstTurn=false;
  }




// This method is called after all hands are finished or only player left in game , and calaulates final results while broadcasting price pool winners
  DisplayPricePool()
  {
    this.state.currentGameState="PricePoolCalculation";

    console.log("all hands over get price pool..!");
    //initializing variables
    let winningPlayerIndex:number=0;
    let runnerupIndex:number=0;
    let maxHandsWon:number=0;
    let maxWonCounts:number=0;
    //getting index of highest wining player
    for(let i:number=0;i<3 ;i++)
    {
      if(this.state.playersInGame[i].isRemoved==true)
      {
        continue;
      }
      if(this.state.playersInGame[i].handsWon>maxHandsWon)
      {
        maxHandsWon=this.state.playersInGame[i].handsWon;
        winningPlayerIndex=i;
      }
    }
    //checking for Tie
    for(let i:number=0;i<3;i++)
    {
      if(this.state.playersInGame[i].isRemoved==true)
      {
        continue;
      }
      if(this.state.playersInGame[i].handsWon==maxHandsWon)
      {
        maxWonCounts++;
      }
    }
    if(maxWonCounts!=1)
    {//there is tie than check for earned chips
          
      for(let i:number=0;i<3;i++)
      {
        if(this.state.playersInGame[i].isRemoved==true)
        {
          continue;
        }
        if(this.state.playersInGame[i].handsWon==maxHandsWon && i!=winningPlayerIndex)
        {
          if(this.state.playersInGame[winningPlayerIndex].totalChipsWon<this.state.playersInGame[i].totalChipsWon)
          {//if other player has won more chps than assing him as winner
            winningPlayerIndex=i;
          }
        }
      }
    }
    if(this.playercounter==2)
    {
      for(let i:number=0;i<3 ;i++)
      {//getting second highest won player (in case of tie not winning player)
            if(this.state.playersInGame[i].isRemoved==false && winningPlayerIndex!=i )
            {
              runnerupIndex=i;
            }

      }
    }
    else
    {
        //reinitialization for runner up
        maxWonCounts=0;
        maxHandsWon=0;
        for(let i:number=0;i<3 ;i++)
        {//getting second highest won player (in case of tie not winning player)
              if(this.state.playersInGame[i].isRemoved==true)
              {
                continue;
              }
              if(this.state.playersInGame[i].handsWon>maxHandsWon && winningPlayerIndex!=i )
              {
                maxHandsWon=this.state.playersInGame[i].handsWon;
                runnerupIndex=i;
              }

        }
        //checking for runnerups tie
        for(let i:number=0;i<3;i++)
        {
          if(this.state.playersInGame[i].isRemoved==true)
          {
            continue;
          }
          if(this.state.playersInGame[i].handsWon==maxHandsWon)
          {
            maxWonCounts++;
          }
        }
        if(maxWonCounts!=1)
        {//there is tie for runners up very low chances of that will not occure if Winner has tie

          for(let i:number=0;i<3;i++)
          {
            if(this.state.playersInGame[i].isRemoved==true)
            {
              continue;
            }
            if(this.state.playersInGame[i].handsWon==maxHandsWon && i!=runnerupIndex && i!=winningPlayerIndex)
            {//comparing for chips won for runner ups 
              if(this.state.playersInGame[runnerupIndex].totalChipsWon<this.state.playersInGame[i].totalChipsWon)
              {
                runnerupIndex=i;
              }
            }
          }
        }
        //got winner and runnerup index
        console.log("  winner /Index: "+winningPlayerIndex+"  runnerup index:"+runnerupIndex);

        //console.log("  winnwr /Index: "+winningPlayerIndex+"  runnerup index:"+runnerupIndex);
    }
    

    //logic for adding price pool amount and broad casting winners to all
    this.state.playersInGame[winningPlayerIndex].myMoney+=(this.state.currentTable.entryFees*3)/2;
    this.state.playersInGame[runnerupIndex].myMoney+=((this.state.currentTable.entryFees*3)*30)/100;
    console.log("  winnwr /Index: "+winningPlayerIndex+"  runnerup index:"+runnerupIndex);
    this.state.playersInGame.forEach(element => {
      if(element.isConnected==true)
      {
          //Sending data save request to client
          this.broadcast("SaveLatestData",{player:JSON.stringify(element)});
      }
    });
    this.clock.clear();
    this.clock.start();
    this.clock.setTimeout(()=>{
      this.state.currentGameState="GameFinished";
      this.state.WinnerIndex=winningPlayerIndex;
      this.state.RunnerupIndex=runnerupIndex;
      this.broadcast("PricePool",{winner:winningPlayerIndex,runner:runnerupIndex});
      this.clock.clear();
      this.clock.start();
      this.isGameFinished=true;
      this.clock.setTimeout(()=>{
        this.disconnect();
      },2000);//this will disconnect server from all players after 2 seconds of result declaration
    },200);
    
  }


  //this method is used to display resulot of currently running hand after delar's turn is finished and broad casts results to all players
  DisplayHandResult()
  {
    this.state.currentGameState="HandResults";
    //initialization
    this.clock.stop();
    this.clock.start();

    //starting from player 1 for result (setting player tracking index to  1)
    this.state.currentTurnOfPlayer=1;

    //setting up splits traking index to zero;
    this.state.playersInGame[0].currentSplitTurn=0;
    this.state.playersInGame[1].currentSplitTurn=0;
    this.state.playersInGame[2].currentSplitTurn=0;


    //Displaying results of each player with 2 second interval
    this.clock.setInterval(()=>{

      //if we have displayed all player's result than start new hand or call DisplayPricePool() method
      if(this.state.currentTurnOfPlayer>3)
      {
        //logic for starting new hand
        this.clock.clear();
        this.clock.start();
        this.broadcast("RemoveDelarsCards");
        //checking for hands limit to display result or start new hand
        if(this.state.currentHandNo < this.state.currentTable.handsLimit)
        {
          //logic for starting new hand
          this.state.currentHandNo++;
          this.winprobabilitycamecounter=0;
          this.CheckPlayerChips();
          this.state.currentGameState="PreparingForNextHand";
          this.broadcast('InitializeNewHand',{handNo:this.state.currentHandNo});
          this.clock.setTimeout(()=>{//logic to add win probability after 2 seconds and starting new hand (useful when one of player is out of game and yet to reconnect)
            console.log("probability came counter="+this.winprobabilitycamecounter+" target="+this.winprobabilitytarget);
            if(this.winprobabilitycamecounter!=this.winprobabilitytarget)
            {
              this.state.playersInGame.forEach(element => {
                if(element.isBot==false)
                {
                  if(Math.random()>0.6)
                   element.winprobability=1;
                  else
                   element.winprobability=0;
                }
                else
                {
                  if(Math.random()<0.6)
                   element.winprobability=1;
                  else
                   element.winprobability=0;
                }
              });
              this.StartHand();
            }
            console.log("starting new hand from server win probability");
          },1000);
          console.log(" Start New Hand ");
        }
        else
        {
          //show price pool
          this.DisplayPricePool();
        }
      }
      else if(this.state.playersInGame[this.state.currentTurnOfPlayer-1].isPlaying==false )//disconsidering player which is out of game (disconnected or has not enough chips)
      {
        this.state.currentTurnOfPlayer++;
      }
      else if(this.state.playersInGame[this.state.currentTurnOfPlayer-1].playerHandDetails[0].isSplited==false && this.state.playersInGame[this.state.currentTurnOfPlayer-1].playerHandDetails[0].isSurrender==true)
      {
        //disconsidering player which has surrendered
        this.state.currentTurnOfPlayer++;
      }
      else
      {
        //console.log(" IF player is surrendered ?????"+this.state.playersInGame[this.state.currentTurnOfPlayer-1].playerHandDetails[0].isSurrender +" Splited???"+this.state.playersInGame[this.state.currentTurnOfPlayer-1].playerHandDetails[0].isSplited);

        //initialization
        let dPoints:number=0;//delar points
        let pPoints:number=0;//player points
        let isDelarBlackjack:boolean=false;
        dPoints=this.state.delar.points;

        //return The Insurance if Delar Has BlackJack
        if( dPoints==21 && this.state.delar.cards.length==2 )
        {
          isDelarBlackjack=true;
          if( this.state.playersInGame[this.state.currentTurnOfPlayer-1].playerHandDetails[0].isInsured==true )
            this.DisplayHandResultForPlayerInsuranceReturn(this.state.currentTurnOfPlayer);
        }
        if(this.state.playersInGame[this.state.currentTurnOfPlayer-1].playerHandDetails[0].isSplited==false)
        {   
            //player don't have any splited cards 
            pPoints=this.state.playersInGame[this.state.currentTurnOfPlayer-1].playerHandDetails[0].points;
            let isPlayerBlackjack:boolean=false;
            if( pPoints==21 && this.state.playersInGame[this.state.currentTurnOfPlayer-1].playerHandDetails[0].cards.length==2)
            {
              isPlayerBlackjack=true;
            }
            

            //checking for winner according to Delar's Blackjack
            if( isDelarBlackjack==true )
            {
              //checking for player Blackjack
              if( isPlayerBlackjack==true)
              {
                //Both delar and player has blackjack so Push
                this.DisplayHandResultForPlayerPush(this.state.currentTurnOfPlayer);
              }
              else
              {
                //Player Lost Because Delar has BlackJack
                this.DisplayHandResultForPlayerLost(this.state.currentTurnOfPlayer);
              }
            }
            else if(isPlayerBlackjack==true)//checking for player blackjack
            {
              //Player has blackjack and delar have not  so Player won with blckjack
              this.DisplayHandResultForPlayerBlackJack(this.state.currentTurnOfPlayer);
            }
           
            else if( (dPoints<22 && dPoints>pPoints)|| pPoints>21 )//(Delar has not burst and high points than player) Delar Won or player burst
            {
                          //Player lost 
                          this.DisplayHandResultForPlayerLost(this.state.currentTurnOfPlayer);
            }       
            else if( pPoints<22 && (dPoints<pPoints || dPoints>21 ) )//Player has not burst and (high points than player or Delar burst)
            {
                        //Player won against delar 
                        this.DisplayHandResultForPlayerWon(this.state.currentTurnOfPlayer);
            }
            else if(dPoints==pPoints)
            {
              //push both delar and player have same Points
              this.DisplayHandResultForPlayerPush(this.state.currentTurnOfPlayer);
            }
            this.state.currentTurnOfPlayer++;

        }
        else
        {
          //Players has splitted cards 
          this.state.playersInGame[this.state.currentTurnOfPlayer-1].currentSplitTurn++;
          //console.log(" --- "+this.state.playersInGame[this.state.currentTurnOfPlayer-1].currentSplitTurn);
          if(this.state.playersInGame[this.state.currentTurnOfPlayer-1].currentSplitTurn<3)//loop ending condition
          {
            if(this.state.playersInGame[this.state.currentTurnOfPlayer-1].playerHandDetails[this.state.playersInGame[this.state.currentTurnOfPlayer-1].currentSplitTurn-1].isSurrender==false)
            {//there is not surrendered for current split 
                pPoints=this.state.playersInGame[this.state.currentTurnOfPlayer-1].playerHandDetails[this.state.playersInGame[this.state.currentTurnOfPlayer-1].currentSplitTurn-1].points;
                
                
                let isPlayerBlackjack:boolean=false;
                if( pPoints==21 && this.state.playersInGame[this.state.currentTurnOfPlayer-1].playerHandDetails[this.state.playersInGame[this.state.currentTurnOfPlayer-1].currentSplitTurn-1].cards.length==2)
                {
                  isPlayerBlackjack=true;
                }
                
                //checking for winner according to Delar's Blackjack
                if( isDelarBlackjack==true )
                {
                  //checking for player Blackjack
                  if( isPlayerBlackjack==true)
                  {
                    //Both delar and player has blackjack so Push
                    this.DisplayHandResultForPlayerPush(this.state.currentTurnOfPlayer,this.state.playersInGame[this.state.currentTurnOfPlayer-1].currentSplitTurn);
                  }
                  else
                  {
                    //Player Lost Because Delar has BlackJack
                    this.DisplayHandResultForPlayerLost(this.state.currentTurnOfPlayer,this.state.playersInGame[this.state.currentTurnOfPlayer-1].currentSplitTurn);
                  }
                }
                else if(isPlayerBlackjack==true)//checking for player blackjack
                {
                  //Player has blackjack and delar have not  so Player won with blckjack
                  this.DisplayHandResultForPlayerBlackJack(this.state.currentTurnOfPlayer,this.state.playersInGame[this.state.currentTurnOfPlayer-1].currentSplitTurn);
                }
                
                else if( (dPoints<22 && dPoints>pPoints)|| pPoints>21 )//(Delar has not burst and high points than player) Delar Won or player burst
                {
                              //Player lost 
                              this.DisplayHandResultForPlayerLost(this.state.currentTurnOfPlayer,this.state.playersInGame[this.state.currentTurnOfPlayer-1].currentSplitTurn);
                }       
                else if( pPoints<22 && (dPoints<pPoints || dPoints>21 ) )//Player has not burst and (high points than player or Delar burst)
                {
                            //Player won against delar 
                            this.DisplayHandResultForPlayerWon(this.state.currentTurnOfPlayer,this.state.playersInGame[this.state.currentTurnOfPlayer-1].currentSplitTurn);
                }
                else if(dPoints==pPoints)
                {
                  //push both delar and player have same Points
                  this.DisplayHandResultForPlayerPush(this.state.currentTurnOfPlayer,this.state.playersInGame[this.state.currentTurnOfPlayer-1].currentSplitTurn);
                }
            }
          }
          else
          {//all splits over start with new player
            this.state.currentTurnOfPlayer++;

          } 
        }
          
      }

      /*for(let i:number=0;i<3;i++){
      console.log(" total chips won :"+this.state.playersInGame[i].totalChipsWon+"  Hands Won:"+this.state.playersInGame[i].handsWon +" +++"+this.state.playersInGame[i].PlayerName);
      }*/
    },2000);
  }



  //this method contains logic for delars turn autoplay
  DelarsHandPlay()
  {
    this.state.currentGameState="delarsTurn";
    this.clock.clear();
    this.clock.start();
    this.state.currentSecondsSpentInTurn=-1;
    //for first time revealing hiden card
    this.broadcast("RevealDelarCard");
    //call to logic for hit untill poinrts>= 17
    this.clock.setTimeout(()=>{
      this.DelarHitIntervals();
    },2000);
  }


  //this methid contains logic for Delars hit untill it reaches point of 17 or more after that result is showen
  DelarHitIntervals()
  {
    this.state.currentGameState="delarsTurn";
    
    //if Points are >=17 than Stop and show results else hit
    this.clock.setInterval(()=>{
      if(this.state.delar.points>=17)//checking for interval end condition
      {
        this.clock.clear();
        this.clock.start();
        this.DisplayHandResult();
      }
      else
      {//Logic for Hit

      
        let i:number=3;
        let c:PlayCard;
        let flag:boolean;
        c=new PlayCard();

        //console.log("call from Delar index");
        //initialize min and max points for getting delars cards 
        let minPoints:number=2;
        let maxPoints:number=21;

        this.state.playersInGame.forEach(element => {//Foreach for all players to get min point (highest point fo losser)and maxPoin(lowest points of winning players) 
            //console.log(element.playerHandDetails[0].points);
            if(element.willWin==true )//checking current player is winning and ts points >=17 
            {
              if(element.playerHandDetails[0].isSplited==false )//Player hase no splits so directly comparing for lowest value for maxpoints
              {
                if( element.playerHandDetails[0].points>=17 && element.playerHandDetails[0].points<maxPoints)
                {
                  maxPoints=element.playerHandDetails[0].points;
                  //console.log(minPoints,maxPoints);
                }
              }
              else//Splits found comparing and assigning maxpoints's value
              {
                  if(element.playerHandDetails[0].points<element.playerHandDetails[1].points)
                  {
                    if(maxPoints>element.playerHandDetails[0].points && element.playerHandDetails[0].points>=17)
                      maxPoints=element.playerHandDetails[0].points;
                  }
                  else
                  {
                    if(maxPoints>element.playerHandDetails[1].points && element.playerHandDetails[1].points>=17)
                      maxPoints=element.playerHandDetails[1].points;
                  }
              }
            }
            else
            {//Player is losing so get min points from maximum of loser Players 
              if(element.playerHandDetails[0].isSplited==false  )//no splits 
              {
                if(element.playerHandDetails[0].points<17 && element.playerHandDetails[0].points> minPoints )
                {
                  minPoints=element.playerHandDetails[0].points;
                  // console.log(minPoints,maxPoints);
                }
              }
              else
              {//checking for splits
                if(element.playerHandDetails[0].points<element.playerHandDetails[1].points)
                {
                  if(minPoints<element.playerHandDetails[1].points && element.playerHandDetails[1].points<17)
                  minPoints=element.playerHandDetails[1].points;
                }
                else
                {
                  if(minPoints<element.playerHandDetails[1].points && element.playerHandDetails[1].points<17)
                    minPoints=element.playerHandDetails[1].points;
                }
              }
            }
          });
          
          
          //getting card with points between min and max points so that lossing player will loss and winning player will win and stored it.
          console.log(this.state.delar.points,minPoints,maxPoints);
          c=this.state.remainingDeck.GetRandomCardForDelar(this.state.delar.points,minPoints,maxPoints);
          this.state.delar.cards.push(c);

          //getting new points
          let newPoints:number=0;
          let acecount:number=0;
          this.state.delar.cards.forEach(element => {
                    if (element.cardPoint == 11)
                    {
                        acecount++;
                    }
                    newPoints += element.cardPoint;
          });
          //resetting ace card values according to result and storing it
          for (let i1:number = 0; i1 < acecount; i1++)
              {
                    if (newPoints > 21)
                    {
                        newPoints -= 10;
                    }
              }
                this.state.delar.points=newPoints;

            //broadcasting Delar Hit cards
                let ct:number=c.cardType;
        this.broadcast("DistributeMainCard",{sitno:(i+1),points:newPoints,card:JSON.stringify(c)});
      }
    },1500);
    
  }



  //this method is used to perform Hit operation and gets called from request by client from onMessage section
  public  Hit(sitNo:number,splitno:number,isDouble:boolean=false)
  {
    //initialization of clock
    this.clock.clear();
    this.clock.start();
    if(this.state.playersInGame[sitNo-1].isRemoved==true)
    {
      this.GetNextTurn();
    }
    else
    {
      let c:PlayCard;
      let flag:boolean;
      c=new PlayCard();
      this.state.isFirstTurnForCurrentPlayer=false;
      console.log("isFirstTurnForCurrentPlayer falsed"+this.state.isFirstTurnForCurrentPlayer);
      if(this.state.playersInGame[sitNo-1].willWin==1)//setting up flag to determin win probability
      {
        flag=true;
      }
      else
      {
        flag=false;
      }
      let newPoints:number=0;
      let acecount:number=0;
  
  
      if(splitno==0)//checking for Split (Weather to add card to default or for specific split)
      {//there is no split 
  
        //getting and saving new card according to win probability
        c=this.state.remainingDeck.GetRandomCard(flag,this.state.playersInGame[sitNo-1].playerHandDetails[0].points,this.state.delar.points);
        this.state.playersInGame[sitNo-1].playerHandDetails[0].cards.push(c);
  
        //getting new points
        this.state.playersInGame[sitNo-1].playerHandDetails[0].cards.forEach(element => {
          if (element.cardPoint == 11)
          {
            acecount++;
          }
          newPoints += element.cardPoint;
        }); 
      
      }
      else
      {//spilit is there 
  
         //getting and saving new card according to win probability
        c=this.state.remainingDeck.GetRandomCard(flag,this.state.playersInGame[sitNo-1].playerHandDetails[splitno-1].points,this.state.delar.points);
        this.state.playersInGame[sitNo-1].playerHandDetails[splitno-1].cards.push(c);
          
        //getting new points
        this.state.playersInGame[sitNo-1].playerHandDetails[splitno-1].cards.forEach(element => {
          if (element.cardPoint == 11)
          {
              acecount++;
          }
          newPoints += element.cardPoint;
        }); 
      }
      //Resetting ace card values as they are fesible
      for (let i1:number = 0; i1 < acecount; i1++)
      {
        if (newPoints > 21)
        {
          newPoints -= 10;
        }
      }
      if(splitno==0)//checking for splits
      {//no splits code
  
        //settign new points and broadcasting to all players
        this.state.playersInGame[sitNo-1].playerHandDetails[0].points=newPoints;
        let ct:number=c.cardType;
        this.broadcast("Hit",{sitno:(sitNo),points:newPoints,cType:ct,cValue:c.cardValue,splitNo:this.state.playersInGame[sitNo-1].currentSplitTurn});
        
        //taking decision according point weather to continue turn or get next turn
        if( this.state.playersInGame[sitNo-1].playerHandDetails[0].points >= 21  || isDouble==true)
        {
          this.clock.setTimeout(()=>{
            this.GetNextTurn();
          },1000);
        }
        else
        {
          this.clock.setTimeout(()=>{
            this.RepeatCurrentTurn();
          },1000);
        }
      }
      else
      {// splits code that handle acording to splits
  
        //settign new points and broadcasting to all players
        this.state.playersInGame[sitNo-1].playerHandDetails[splitno-1].points=newPoints;
        let ct:number=c.cardType;
        this.broadcast("Hit",{sitno:(sitNo),points:newPoints,cType:ct,cValue:c.cardValue,splitNo:this.state.playersInGame[sitNo-1].currentSplitTurn});
  
        //taking decision according point weather to continue turn or start turn for next split or get next turn
        if( this.state.playersInGame[sitNo-1].playerHandDetails[splitno-1].points >= 21  || isDouble==true)
        {
          this.clock.setTimeout(()=>{
            if(splitno==1)
            {
              this.state.playersInGame[sitNo-1].currentSplitTurn++;
              this.state.isFirstTurnForCurrentPlayer=true;
              console.log("isFirstTurnForCurrentPlayer trued"+this.state.isFirstTurnForCurrentPlayer);
              this.RepeatCurrentTurn();
            }
            else
            {
              this.GetNextTurn();
            }
          },1000);
        }
        else
        {
          this.clock.setTimeout(()=>{
            this.RepeatCurrentTurn();
          },1000);
        }
      }
    }
  }



  //this method is used to perform Stand operation and gets called from request by client from onMessage section or by timeout
  Stand(sitNo:number,splitno:number)
  {
    //reset clock to stope timeout and broadcast stand message to all
    this.clock.clear();
    this.clock.start();
    if(this.state.playersInGame[sitNo-1].isRemoved==true)
    {
      this.GetNextTurn();
    }
    else
    {
      this.state.isFirstTurnForCurrentPlayer=false;
      console.log("isFirstTurnForCurrentPlayer falsed"+this.state.isFirstTurnForCurrentPlayer);
      this.broadcast("Stand",{sitno:(sitNo),splitNo:(this.state.playersInGame[sitNo-1].currentSplitTurn)});
      
      //get decision weathr to move to next player or to next split 
      this.clock.setTimeout(()=>{
        if(splitno==1)
        {
          this.state.playersInGame[sitNo-1].currentSplitTurn++;
          this.state.isFirstTurnForCurrentPlayer=true;
          console.log("isFirstTurnForCurrentPlayer trued"+this.state.isFirstTurnForCurrentPlayer);
          this.RepeatCurrentTurn();
        }
        else if(splitno==2 || splitno==0)
        {
          this.GetNextTurn();
        }
      },1000);
    }
  }




  //this method is used to perform Surrender operation and gets called from request by client from onMessage section
  Surrender(sitNo:number,splitno:number=0)
  {
    
    this.clock.clear();
    this.clock.start();
    if(this.state.playersInGame[sitNo-1].isRemoved==true)
    {
      this.GetNextTurn();
    }
    else
    {
      //checking for splits and managing chips accordingly
      this.state.isFirstTurnForCurrentPlayer=false;
      console.log("isFirstTurnForCurrentPlayer falsed"+this.state.isFirstTurnForCurrentPlayer);
      if(splitno==0)
      {//no splits
        this.state.playersInGame[sitNo-1].myChips+=(this.state.playersInGame[sitNo-1].playerHandDetails[0].bet)/2;
        this.state.playersInGame[sitNo-1].playerHandDetails[0].isSurrender=true;
      }
      else
      {//splits
        this.state.playersInGame[sitNo-1].myChips+=(this.state.playersInGame[sitNo-1].playerHandDetails[splitno-1].bet)/2;
        this.state.playersInGame[sitNo-1].playerHandDetails[splitno-1].isSurrender=true;
      }

      //brodcasting to all
      this.broadcast("Surrender",{sitno:(sitNo),splitNo:(splitno)});

      //taking decision for moving turn to next split or next player
      this.clock.setTimeout(()=>{
        if(splitno==1)
        {
          this.state.playersInGame[sitNo-1].currentSplitTurn++;
          this.state.isFirstTurnForCurrentPlayer=true;
          console.log("isFirstTurnForCurrentPlayer trued"+this.state.isFirstTurnForCurrentPlayer);

          this.RepeatCurrentTurn();
        }
        else if(splitno==0 || splitno==2)
          this.GetNextTurn();
      },1000);
    }
  }





  //this method is used to perform Insurance operation and gets called from request by client from onMessage section
  Insure(sitNo:number)
  {
  
    this.clock.clear();
    this.clock.start();
    if(this.state.playersInGame[sitNo-1].isRemoved==true)
    {
      this.GetNextTurn();
    }
    else
    {
      //deducting chips and broadcasting to all players
      this.state.playersInGame[sitNo-1].myChips-=(this.state.playersInGame[sitNo-1].playerHandDetails[0].bet/2);
      this.state.playersInGame[sitNo-1].playerHandDetails[0].isInsured=true;
      this.state.playersInGame[sitNo-1].totalChipsInCurrentBet+=(this.state.playersInGame[sitNo-1].playerHandDetails[0].bet/2);
      this.broadcast("Insure",{sitno:(sitNo)});
      //repeating same turn
      this.clock.setTimeout(()=>{
        this.RepeatCurrentTurn();
      },1000);
    }
  }




  //this method is used to perform Double operation and gets called from request by client from onMessage section
  Double(sitNo:number,splitno:number=0)
  {
    this.clock.clear();
    this.clock.start();
    if(this.state.playersInGame[sitNo-1].isRemoved==true)
    {
      this.GetNextTurn();
    }
    else
    {
      //checking for splits and deducting/broadcasting accrdingly
      //lastly calling hit with isDouble argument true so only one card will be distributed and next turn will start
      if(splitno==0)
      {//splits
        this.state.playersInGame[sitNo-1].myChips-=(this.state.playersInGame[sitNo-1].playerHandDetails[splitno].bet);
        this.state.playersInGame[sitNo-1].totalChipsInCurrentBet+=(this.state.playersInGame[sitNo-1].playerHandDetails[splitno].bet);
        this.state.playersInGame[sitNo-1].playerHandDetails[splitno].isDouble=true;
        this.broadcast("Double",{sitno:(sitNo),splitNo:(splitno)});
        this.Hit(sitNo,splitno,true);
      }
      else
      {//no splits
        this.state.playersInGame[sitNo-1].myChips-=(this.state.playersInGame[sitNo-1].playerHandDetails[splitno-1].bet);
        this.state.playersInGame[sitNo-1].totalChipsInCurrentBet+=(this.state.playersInGame[sitNo-1].playerHandDetails[splitno-1].bet);
        this.state.playersInGame[sitNo-1].playerHandDetails[splitno-1].isDouble=true;
        this.broadcast("Double",{sitno:(sitNo),splitNo:(splitno)});
        this.Hit(sitNo,splitno,true);
      }
    }
  }



  //this method is used to perform Split operation and gets called from request by client from onMessage section
  Split(sitNo:number)
  {
    this.clock.clear();
    this.clock.start();
    if(this.state.playersInGame[sitNo-1].isRemoved==true)
    {
      this.GetNextTurn();
    }
    else
    {
      this.state.currentGameState="SplitDuration";
      this.isBotFirstTurn=true;//so that bot can perform double for splits

      //setting up data for Split accrding to Player
      this.state.playersInGame[sitNo-1].myChips-=(this.state.playersInGame[sitNo-1].playerHandDetails[0].bet);
      this.state.playersInGame[sitNo-1].playerHandDetails[0].isSplited=true;
      this.state.playersInGame[sitNo-1].playerHandDetails[0].splitno=1;
      this.state.playersInGame[sitNo-1].totalChipsInCurrentBet+=(this.state.playersInGame[sitNo-1].playerHandDetails[0].bet);

      //creating new object for new split and assigning values to them and saving to player data
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

      //getting second card of first split and storing it to second split
      let c:PlayCard;
      c=this.state.playersInGame[sitNo-1].playerHandDetails[0].cards.at(1);
      phd.cards.push(c);
      this.state.playersInGame[sitNo-1].playerHandDetails[0].cards.deleteAt(1);
      this.state.playersInGame[sitNo-1].playerHandDetails.push(phd);

      //broadcasting to all and invoking logic for dispencing second card for both splits
      this.broadcast("Split",{sitno:(sitNo)});
      this.clock.setTimeout(()=>{
        this.DispenceSplitedCard(sitNo);
      },1500);
    }
  }




  //this method is used to distribute scond cards for Splited card called by Split()
  DispenceSplitedCard(sitNo:number)
  {
    this.clock.clear();
    this.clock.start();
    if(this.state.playersInGame[sitNo-1].isRemoved==true)
    {
      this.GetNextTurn();
    }
    else
    {
      let i:number=0;
      
      // setting interval between two cards dispensing and using i as counter 
      this.clock.setInterval(()=>{
        if(i<2 && this.state.playersInGame[sitNo-1].isRemoved==false)//ending condition
        {
          this.state.currentGameState="SplitedcardsDistribution";
          //initializing variable used for getting new card accrding to win probability
          let c:PlayCard;
          let flag:boolean;
          c=new PlayCard();
          if(this.state.playersInGame[sitNo-1].willWin==1)//settign flag variable representing win probability
          {
            flag=true;
          }
          else
            flag=false;
          
          //gettig and storing new card
          c=this.state.remainingDeck.GetRandomCard(flag,this.state.playersInGame[sitNo-1].playerHandDetails[i].points,this.state.delar.points);
          this.state.playersInGame[sitNo-1].playerHandDetails[i].cards.push(c);

          //getting new point for particular split
          let newPoints:number=0;
          let acecount:number=0;
          this.state.playersInGame[sitNo-1].playerHandDetails[i].cards.forEach(element => {
            if (element.cardPoint == 11)
            {
                acecount++;
            }
            newPoints += element.cardPoint;
          });
          //resettign ace card values as fesible to particular split
          for (let i1:number = 0; i1 < acecount; i1++)
          {
            if (newPoints > 21)
            {
              newPoints -= 10;
            }
          }

          //storing points and roadcasting to all 
          this.state.playersInGame[sitNo-1].playerHandDetails[i].points=newPoints;
          let ct:number=c.cardType;
          console.log("card Sent");
          this.broadcast("DistributeSplitedCard",{sitno:(sitNo),points:newPoints,cType:ct,cValue:c.cardValue,splitNo:(i+1)});
        }
        if(i==2)
        {//resetting clock and starting turn for split one for same player
          this.clock.clear();
          this.clock.start();
          this.state.playersInGame[sitNo-1].currentSplitTurn=1;
          this.state.isFirstTurnForCurrentPlayer=true;
          console.log("isFirstTurnForCurrentPlayer trued"+this.state.isFirstTurnForCurrentPlayer);

          this.RepeatCurrentTurn();
        }
        i++;
      },1500);
    }
  }





  //this method is called before every hand starts and basically kicks out player which are ofline or have not suffieciant chips to continue
  public CheckPlayerChips()
  {
    let playersPlaying:number=0;//used to keep trake of total players playing the game

    //setting every player as they can play or not accrding to chip balance
    this.state.playersInGame.forEach(element => {
      if(element.myChips<this.state.currentTable.minBet &&element.isPlaying==true)
      {
          element.isPlaying=false;
          this.broadcast("PlayerIsOutOfGame",{sitno:element.SitNo});
          this.winprobabilitytarget--;
      }
      else
      {
        playersPlaying++;
      }
    });
  }





  //this method is used to Manage chips for Loss and broadcast the result to all
  public DisplayHandResultForPlayerLost(playerIndex:number,splitNo:number=0)
  {
    this.state.playersInGame[playerIndex-1].totalChipsInCurrentBet=0;
    this.broadcast("PlayerHandLoss",{sitno:(playerIndex),splitNo:(splitNo)});
  }


  //this method is used for distributing insurance ammount to player
  public DisplayHandResultForPlayerInsuranceReturn(playerIndex:number,splitNo:number=0)
  {
    //getting return ammount and add/subtarct from accrding chips balances (my chips and chips in bet)
    if(splitNo!=0)
    {
      splitNo--;
    }
    let returnAmmount:number=0;
    returnAmmount=this.state.playersInGame[playerIndex-1].playerHandDetails[splitNo].bet*1.5;
    this.state.playersInGame[playerIndex-1].totalChipsInCurrentBet-=this.state.playersInGame[playerIndex-1].playerHandDetails[splitNo].bet/2;
    this.state.playersInGame[playerIndex-1].myChips+=returnAmmount;
    //this.broadcast("SaveLatestData",{player:JSON.stringify(this.state.playersInGame[playerIndex-1])});
  }



  //this method is used to Manage chips for BlackJack and broadcast the result to all
  public DisplayHandResultForPlayerBlackJack(playerIndex:number,splitNo:number=0)
  {
    let SplitIndex:number=splitNo;
    if(SplitIndex!=0)
    {
      SplitIndex--;
    }
    this.state.playersInGame[playerIndex-1].handsWon++;
    this.state.playersInGame[playerIndex-1].totalChipsInCurrentBet=0;
    //gettign win ammount 
    let wonAmmount:number=0;
    let doubleMultiplayer:number=1;
    wonAmmount=(this.state.playersInGame[playerIndex-1].playerHandDetails[SplitIndex].bet*1.5);
    if(this.state.playersInGame[playerIndex-1].playerHandDetails[SplitIndex].isDouble==true)//settign double multiplayer accrdingly
    {
      doubleMultiplayer=2;
    }
    //adding to chips balance and broadcasting
    this.state.playersInGame[playerIndex-1].totalChipsWon+=wonAmmount*doubleMultiplayer;
    this.state.playersInGame[playerIndex-1].myChips+=(wonAmmount+this.state.playersInGame[playerIndex-1].playerHandDetails[SplitIndex].bet)*doubleMultiplayer;
    this.broadcast("PlayerHandBJ",{sitno:(playerIndex),splitNo:(splitNo)});
    
  } 

  //this method is used to Manage chips for win and broadcast the result to all
  public DisplayHandResultForPlayerWon(playerIndex:number,splitNo:number=0)
  {
    let SplitIndex:number=splitNo;
    if(SplitIndex!=0)
    {
      SplitIndex--;
    }
    this.state.playersInGame[playerIndex-1].handsWon++;
    this.state.playersInGame[playerIndex-1].totalChipsInCurrentBet=0;
    //gettign win ammount 
    let wonAmmount:number=0;
    let doubleMultiplayer:number=1;
    wonAmmount=(this.state.playersInGame[playerIndex-1].playerHandDetails[SplitIndex].bet);
    if(this.state.playersInGame[playerIndex-1].playerHandDetails[SplitIndex].isDouble==true)//settign double multiplayer accrdingly
    {
      doubleMultiplayer=2;
    }
    //adding to chips balance and broadcasting

    this.state.playersInGame[playerIndex-1].totalChipsWon+=wonAmmount*doubleMultiplayer;
    this.state.playersInGame[playerIndex-1].myChips+=(wonAmmount+this.state.playersInGame[playerIndex-1].playerHandDetails[SplitIndex].bet)*doubleMultiplayer;
    this.broadcast("PlayerHandWin",{sitno:(playerIndex),splitNo:(splitNo)});
    
  }
  
  //this method is used to Manage chips for Push and broadcast the result to all
  public DisplayHandResultForPlayerPush(playerIndex:number,splitNo:number=0)
  {
    let SplitIndex:number=splitNo;
    if(SplitIndex!=0)
    {
      SplitIndex--;
    }
    this.state.playersInGame[playerIndex-1].totalChipsInCurrentBet=0;
    let doubleMultiplayer:number=1;
    if(this.state.playersInGame[playerIndex-1].playerHandDetails[SplitIndex].isDouble==true)//settign double multiplayer accordingly
    {
      doubleMultiplayer=2;
    }
    //adding chips and broadcasting to all
    this.state.playersInGame[playerIndex-1].myChips+=this.state.playersInGame[playerIndex-1].playerHandDetails[SplitIndex].bet*doubleMultiplayer;
    this.broadcast("PlayerHandPush",{sitno:(playerIndex),splitNo:(splitNo)});
  }

  //this method is used for Player's decision making while player is out due to connection problems and reconnection is not timed out till player reconnects or timeout for reconnection
  public PlayersDecisionTakingBot(playerSit:number,doInstant:boolean=false)
  {
    console.log("BotTurn from method for Player :"+this.state.playersInGame[playerSit-1].PlayerName+" :isconnected : "+this.state.playersInGame[playerSit-1].isConnected+" Time Ellipsed at call time(sec) ="+this.state.currentSecondsSpentInTurn);
    let Timetowait:number=Math.floor(Math.random() * (7000 - 4000 + 1) + 4000);
    if(doInstant==true)
    {
      Timetowait=0;
    }
    this.clock.setTimeout(()=>{
      //checking if Player is Connected or not if player is connected before decision making Skip Bot's Decision
      if(this.state.playersInGame[playerSit-1].isConnected==false)
      {
        this.DecisionexecutionarForPlayerBot(playerSit);
      }
    },Timetowait);
  }

  public DecisionexecutionarForPlayerBot(playerSit:number)
  {
    //player is still disconnected take decision on belaf of player
    let operationToperform:number=this.DecisionTakerForPlayerBot(playerSit);
    /*
      1=Hit
      2=Stand
      3=Surrender
      4=Split
      5=Double or Stand//check for balance and 50-50% chance for Double/stand
      6=Double OR Hit //check for balance and 50-50% chance for Double/Hit
      7=surrender else Stand//check for balance and 50-50% chance for surrender/stand
      8=surrender else Hit//check for balance and 50-50% chance for surrender/Hit
      9=Double
      10=insure
    */

    let midBet:number=this.state.currentTable.minBet;//used to store mid bet points for player to take decisions about double surrender etc according to risk of lossing chips
    for(let j:number=2;j<=4;j++)
    {//incrementing Bet ammount accordnig to tabels bet options
            let newBetAmt:number=0;
            if(j%2==0)
            {
              newBetAmt=midBet*5;
            }
            else
            {
              newBetAmt= midBet*2;
            }
            midBet=newBetAmt;
    }
    //taking decision from suggesion for double /hit or surrender/hit as well as for double /stand or surrender/stand
    switch(operationToperform)
    {
      case 5:
            if(this.state.playersInGame[playerSit-1].myChips>=this.state.playersInGame[playerSit-1].playerHandDetails[0].bet && this.state.playersInGame[playerSit-1].playerHandDetails[0].bet<=midBet)
            {
            //Double
            operationToperform=9;
            }
            else
            {
              //stand
              operationToperform=2;
            }
        break;
      case 6:
          if(this.state.playersInGame[playerSit-1].myChips>=this.state.playersInGame[playerSit-1].playerHandDetails[0].bet && this.state.playersInGame[playerSit-1].playerHandDetails[0].bet<=midBet)
          {
            //Double
            operationToperform=9;
          }
          else
          {
            //Hit
            operationToperform=1;
          }
        break;
      case 7:
        if(this.state.playersInGame[playerSit-1].playerHandDetails[0].bet>midBet)
        {
        //Surrender
        operationToperform=3;
        }
        else
        {
          //stand
          operationToperform=2;
        }
        break;
      case 8:
        if(this.state.playersInGame[playerSit-1].playerHandDetails[0].bet>midBet)
        {
        //Surrender
        operationToperform=3;
        }
        else
        {
          //hit
          operationToperform=1;
        }
        break;
    }
    //now calling according callbacks for players
    switch(operationToperform)
    {
      case 1:
        this.Hit(playerSit,this.state.playersInGame[playerSit-1].currentSplitTurn);
        break;
      case 2:
        this.Stand(playerSit,this.state.playersInGame[playerSit-1].currentSplitTurn);
        break;
      case 3:
        this.Surrender(playerSit,this.state.playersInGame[playerSit-1].currentSplitTurn);
        break;
      case 4:
        this.Split(playerSit);
        break;
      case 9:
        this.Double(playerSit,this.state.playersInGame[playerSit-1].currentSplitTurn);
        break;
      case 10:
        this.Insure(playerSit);
        break;
    }
  }
  public DecisionTakerForPlayerBot(playerSit:number)
  {
    // still left to handle logic for Splited cards accordingly
    let operationToperform:number=0;
      /*
        1=Hit
        2=Stand
        3=Surrender
        4=Split
        5=Double or Stand//check for balance and 50-50% chance for Double/stand
        6=Double OR Hit //check for balance and 50-50% chance for Double/Hit
        7=surrender else Stand//check for balance and 50-50% chance for surrender/stand
        8=surrender else Hit//check for balance and 50-50% chance for surrender/Hit
        9=Double
        10=insure
      */
      let isToInsure:boolean=false;

    if(this.state.isFirstTurnForCurrentPlayer==true)//checking for first turn for Split, double Insure operations 
    {//it's first Turn logic for all operation including Split,Insure,Double for both Split's first turn as well as for very first Turn

      
      //checking for very first Turn(No Splits) (Split , Insure , Double) 
      if( this.state.playersInGame[playerSit-1].playerHandDetails[0].isSplited==false)
      {
        //checking for Splits cards (both cards are same)

        //checking for Posible Split Operations
        if(this.state.playersInGame[playerSit-1].playerHandDetails[0].cards[0].cardPoint == this.state.playersInGame[playerSit-1].playerHandDetails[0].cards[1].cardPoint)
        {//there is chance for Split let's check if Splits are fesible or not

          //logic of handling all possible operations for both crads having same cardPoint
          let splitableCardPoint:number=this.state.playersInGame[playerSit-1].playerHandDetails[0].cards[0].cardPoint;
          if(splitableCardPoint==11 || splitableCardPoint== 8)
          {//alwas SPlit as it gets fesible
            //Split
            operationToperform=4;
          }
          else if(splitableCardPoint==10)
          {
            //stand
            operationToperform=2;
          }
          else if(splitableCardPoint==9)
          {
            if(this.state.delar.cards[0].cardPoint>9 || this.state.delar.cards[0].cardPoint==7)
            {//Stand as delar has high cards so Split can't work
            //stand
            operationToperform=2;
            }
            else
            {//alwas SPlit as it gets fesible
              //Split
              operationToperform=4;
            }
          }
          else//cardpoints are between 2 to 7
          {
            if(this.state.delar.cards[0].cardPoint<8)
            {
              if(splitableCardPoint!=5)
              {//disconsiedering 5 for Splitting as guideline
                if(splitableCardPoint==4 && (this.state.delar.cards[0].cardPoint<5 || this.state.delar.cards[0].cardPoint>6))
                {
                    //hit
                  operationToperform=1;
                  if(this.state.delar.cards[0].cardPoint==11 && this.state.playersInGame[playerSit-1].playerHandDetails[0].isInsured==false && this.state.playersInGame[playerSit-1].myChips>(this.state.playersInGame[playerSit-1].playerHandDetails[0].bet/2))
                  {
                    isToInsure=true;
                  }
                }
                else if(splitableCardPoint==6 && this.state.delar.cards[0].cardPoint==7)
                {
                  //hit
                  operationToperform=1;
                }
                else
                {
                  //Split
                  operationToperform=4;
                }
              }
            }
            else
            {
              if(splitableCardPoint==5 && this.state.delar.cards[0].cardPoint<10)
              {
                //Double OR Hit
                operationToperform=6;
              }
              else
              {
                //hit
                operationToperform=1;
                if(this.state.delar.cards[0].cardPoint==11 && this.state.playersInGame[playerSit-1].playerHandDetails[0].isInsured==false && this.state.playersInGame[playerSit-1].myChips>(this.state.playersInGame[playerSit-1].playerHandDetails[0].bet/2))
                {
                  isToInsure=true;
                }
              }
            }
          }
        }


        //logic for one ace and one non-ace card
        if(this.state.playersInGame[playerSit-1].playerHandDetails[0].cards[0].cardPoint==11 || this.state.playersInGame[playerSit-1].playerHandDetails[0].cards[0].cardPoint==11)
        {//logic of   all possible operations while player has One Ace(cardpoint ==11) 
          let nonAceCardPoint:number=0;
          if(this.state.playersInGame[playerSit-1].playerHandDetails[0].cards[0].cardPoint==11)
          {
            nonAceCardPoint=this.state.playersInGame[playerSit-1].playerHandDetails[0].cards[1].cardPoint;
          }
          else
          {
            nonAceCardPoint=this.state.playersInGame[playerSit-1].playerHandDetails[0].cards[0].cardPoint;
          }

          if(nonAceCardPoint==8 || nonAceCardPoint==9)
          {
            //stand 
            operationToperform=2;
          }
          else if(nonAceCardPoint==7)
          {
            if(this.state.delar.cards[0].cardPoint>8)
            {
              //hit 
              operationToperform=1;
              if(this.state.delar.cards[0].cardPoint==11 && this.state.playersInGame[playerSit-1].playerHandDetails[0].isInsured==false && this.state.playersInGame[playerSit-1].myChips>(this.state.playersInGame[playerSit-1].playerHandDetails[0].bet/2))
              {
                isToInsure=true;
              }
            }
            else
            {
              if(this.state.delar.cards[0].cardPoint>2 && this.state.delar.cards[0].cardPoint<7)
              {
                //double or stand
                operationToperform=5;
              }
              else
              {
                //stand
                operationToperform=2;
              }
            }
          }
          else //non ace card value id between 2 to 6
          {
            //by default perform Hit
            operationToperform=1;
            //now changing decision if required
            if(this.state.delar.cards[0].cardPoint>2 && this.state.delar.cards[0].cardPoint<7)
            {
              if(nonAceCardPoint==6)
              {
                //Double or Hit
                operationToperform=6;
              }
              else if(nonAceCardPoint==5||nonAceCardPoint==4)
              {
                if(this.state.delar.cards[0].cardPoint!=3)
                {
                  //Double or Hit
                  operationToperform=6;
                }
              } 
              else 
              {
                if(this.state.delar.cards[0].cardPoint==5||this.state.delar.cards[0].cardPoint==6)
                {
                  //Double or Hit
                  operationToperform=6;
                }
              }
            }
            if(operationToperform==1 &&this.state.delar.cards[0].cardPoint==11 && this.state.playersInGame[playerSit-1].playerHandDetails[0].isInsured==false && this.state.playersInGame[playerSit-1].myChips>(this.state.playersInGame[playerSit-1].playerHandDetails[0].bet/2))
            {
              isToInsure=true;
            }
          }
        }
        

        //logic for non-splitable(both cards have different values) and not containing ace cards
        let totalCardPoints=this.state.playersInGame[playerSit-1].playerHandDetails[0].points;
        if(totalCardPoints<17)
        {
          //by default Hit operation
          operationToperform=1;
          //now changing decision if required 
          if(totalCardPoints==16)
          {
            if(this.state.delar.cards[0].cardPoint<7)
            {
              //stand
              operationToperform=2;
            }
            else if(this.state.delar.cards[0].cardPoint>8)
            {
              if(this.state.delar.cards[0].cardPoint==10)
              {
                //surrender else Stand
                operationToperform=7;
              }
              else
              {
                //surrender else Hit
                operationToperform=8;
              }
            }
          }
          else if(totalCardPoints==15)
          {
            if(this.state.delar.cards[0].cardPoint<7)
            {
              //stand
              operationToperform=2;
            }
            else if(this.state.delar.cards[0].cardPoint=10)
            {
              //surrender else Hit
              operationToperform=8;
            }
          }
          else if(totalCardPoints>12)
          {
            if(this.state.delar.cards[0].cardPoint<7)
            {
              //stand
              operationToperform=2;
            }
          }
          else if(totalCardPoints==12)
          {
            if(this.state.delar.cards[0].cardPoint<7 && this.state.delar.cards[0].cardPoint>3)
            {
              //stand
              operationToperform=2;
            }
          }
          else if(totalCardPoints==11)
          {
            if(this.state.delar.cards[0].cardPoint<11)
            {
              //Double OR Hit
              operationToperform=6;
            }
          }
          else if(totalCardPoints==10)
          {
            if(this.state.delar.cards[0].cardPoint<10)
            {
              //Double OR Hit
              operationToperform=6;
            }
          }
          else if(totalCardPoints==9)
          {
            if(this.state.delar.cards[0].cardPoint<7 && this.state.delar.cards[0].cardPoint>2)
            {
              //Double OR Hit
              operationToperform=6;
            }

          }
          if(operationToperform==1 &&this.state.delar.cards[0].cardPoint==11 && this.state.playersInGame[playerSit-1].playerHandDetails[0].isInsured==false && this.state.playersInGame[playerSit-1].myChips>(this.state.playersInGame[playerSit-1].playerHandDetails[0].bet/2))
          {
            isToInsure=true;
          }
        }
        else
        {//stand at this point as chances of burst are high
          //stand
          operationToperform=2;
        }
      }
      else
      {//logic for first Turn for Splits(double ,hit, surrender , stand)
        // no Split and Insurence


        //logic for one ace and one non-ace card
        if(this.state.playersInGame[playerSit-1].playerHandDetails[this.state.playersInGame[playerSit-1].currentSplitTurn].cards[0].cardPoint==11 || this.state.playersInGame[playerSit-1].playerHandDetails[this.state.playersInGame[playerSit-1].currentSplitTurn].cards[0].cardPoint==11)
        {//logic of   all possible operations while player has One Ace(cardpoint ==11) 
          let nonAceCardPoint:number=0;
          if(this.state.playersInGame[playerSit-1].playerHandDetails[this.state.playersInGame[playerSit-1].currentSplitTurn].cards[0].cardPoint==11)
          {
            nonAceCardPoint=this.state.playersInGame[playerSit-1].playerHandDetails[this.state.playersInGame[playerSit-1].currentSplitTurn].cards[1].cardPoint;
          }
          else
          {
            nonAceCardPoint=this.state.playersInGame[playerSit-1].playerHandDetails[this.state.playersInGame[playerSit-1].currentSplitTurn].cards[0].cardPoint;
          }

          if(nonAceCardPoint==8 || nonAceCardPoint==9)
          {
            //stand 
            operationToperform=2;
          }
          else if(nonAceCardPoint==7)
          {
            if(this.state.delar.cards[0].cardPoint>8)
            {
              //hit 
              operationToperform=1;
            }
            else
            {
              if(this.state.delar.cards[0].cardPoint>2 && this.state.delar.cards[0].cardPoint<7)
              {
                //double or stand
                operationToperform=5;
              }
              else
              {
                //stand
                operationToperform=2;
              }
            }
          }
          else //non ace card value id between 2 to 6
          {
            //by default perform Hit
            operationToperform=1;
            //now changing decision if required
            if(this.state.delar.cards[0].cardPoint>2 && this.state.delar.cards[0].cardPoint<7)
            {
              if(nonAceCardPoint==6)
              {
                //Double or Hit
                operationToperform=6;
              }
              else if(nonAceCardPoint==5||nonAceCardPoint==4)
              {
                if(this.state.delar.cards[0].cardPoint!=3)
                {
                  //Double or Hit
                  operationToperform=6;
                }
              } 
              else 
              {
                if(this.state.delar.cards[0].cardPoint==5||this.state.delar.cards[0].cardPoint==6)
                {
                  //Double or Hit
                  operationToperform=6;
                }
              }
            }
          }
        }
        

        //logic for all cards(both splitable or non-splitable) and not containing ace cards
        let totalCardPoints=this.state.playersInGame[playerSit-1].playerHandDetails[0].points;
        if(totalCardPoints<17)
        {
          //by default Hit operation
          operationToperform=1;
          //now changing decision if required 
          if(totalCardPoints==16)
          {
            if(this.state.delar.cards[0].cardPoint<7)
            {
              //stand
              operationToperform=2;
            }
            else if(this.state.delar.cards[0].cardPoint>8)
            {
              if(this.state.delar.cards[0].cardPoint==10)
              {
                //surrender else Stand
                operationToperform=7;
              }
              else
              {
                //surrender else Hit
                operationToperform=8;
              }
            }
          }
          else if(totalCardPoints==15)
          {
            if(this.state.delar.cards[0].cardPoint<7)
            {
              //stand
              operationToperform=2;
            }
            else if(this.state.delar.cards[0].cardPoint=10)
            {
              //surrender else Hit
              operationToperform=8;
            }
          }
          else if(totalCardPoints>12)
          {
            if(this.state.delar.cards[0].cardPoint<7)
            {
              //stand
              operationToperform=2;
            }
          }
          else if(totalCardPoints==12)
          {
            if(this.state.delar.cards[0].cardPoint<7 && this.state.delar.cards[0].cardPoint>3)
            {
              //stand
              operationToperform=2;
            }
          }
          else if(totalCardPoints==11)
          {
            if(this.state.delar.cards[0].cardPoint<11)
            {
              //Double OR Hit
              operationToperform=6;
            }
          }
          else if(totalCardPoints==10)
          {
            if(this.state.delar.cards[0].cardPoint<10)
            {
              //Double OR Hit
              operationToperform=6;
            }
          }
          else if(totalCardPoints==9)
          {
            if(this.state.delar.cards[0].cardPoint<7 && this.state.delar.cards[0].cardPoint>2)
            {
              //Double OR Hit
              operationToperform=6;
            }

          }
        }
        else
        {//stand at this point as chances of burst are high
          //stand
          operationToperform=2;
        }
        isToInsure=false;
      }
    }
    else//logic for other Turns (Only Hit , Stand or Surrender)
    {
      //no Split,insurance,double
      //also no surrender because bot will surrender in first turns if it hase to from second turns no need to surrender just hit untill points are >= 17
      let totalCardPoints=this.state.playersInGame[playerSit-1].playerHandDetails[this.state.playersInGame[playerSit-1].currentSplitTurn].points;
      if(totalCardPoints>16)
      {
        //stand
        operationToperform=2;
      }
      else
      {
        //hit
        operationToperform=1;
      }
      isToInsure=false;
    }

    if(isToInsure==true)
    {
      operationToperform=10;
    }
    return operationToperform;
  }
  //used to take out player of the game his/her result will not be considered
  public ReconnectFailedForPlayer(playerSessionId:string)
  {
    
    this.state.playersInGame.forEach(element => {
      if(element.sessionId==playerSessionId)
      {
        element.isRemoved=true;
        element.isconnected=false;
        element.isPlaying=false;
        this.broadcast("PlayerQuited",{sitNo:element.SitNo});
        if(this.state.currentTurnOfPlayer==element.SitNo)
        {
          this.clock.clear();
          this.clock.start();
          this.GetNextTurn();
        }
      }
    });

    this.playercounter--;
    if(this.playercounter<2)
    {// if less than two Player left then show results according to game Performance  
      let WinnerIndex:number=0;
      this.state.playersInGame.forEach(element => {
        if(element.isRemoved==false)
        {
          WinnerIndex=element.SitNo-1;
        }
      });
      this.clock.clear();
      this.clock.start();
      this.clock.setTimeout(()=>{
        this.state.currentGameState="GameFinished";
        this.state.WinnerIndex=WinnerIndex;
        this.state.RunnerupIndex=-1;
        this.broadcast("PricePool",{winner:WinnerIndex,runner:-1});
        this.clock.clear();
        this.clock.start();
        this.isGameFinished=true;
        this.clock.setTimeout(()=>{
          this.disconnect();
        },2000);//this will disconnect server from all players after 2 seconds of result declaration
      },1500);
    }

  }
}