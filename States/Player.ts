import { type,Schema, MapSchema, ArraySchema, Context } from "@colyseus/schema";
import {PlayerHandData} from "./PlayerHandData"

//used to Store Players Details as well as used for bot 
export class Player extends Schema
{

    Player(p:any)
    {
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
        console.log(player);
        return player;
    }

    @type('string') 
    sessionId:String;
    
    @type([PlayerHandData]) 
    playerHandDetails:ArraySchema<PlayerHandData>;//Array for handling splits data as well as normal data for plyer's current hand details (i.e. cards points, bet ,etc)
    
    @type('string') 
    gameId:String;//Unique id of player
    
    @type('int32') 
    currentSplitTurn:number;//used for trackinh split for turn
    
    @type('string') 
    PlayerName:String;
    
    @type('uint8') 
    SitNo:number;//stores sit no of player in gameplay
    
    @type('uint64') 
    totalChipsInCurrentBet:number;// ammount of chips in current Pot
    
    @type('uint64') 
    lastbet:number;//Previous bet
    
    @type('uint64') 
    myChips:number;//chips balance of player
    
    @type('uint64') 
    myMoney:number;//cash balance of player
    
    @type('uint8') 
    handsWon:number;//no. of hands won by player
    
    @type('uint64') 
    totalChipsWon:number;//total chips won by player
    
    @type('boolean') 
    isBot:boolean;//to determine between bot nad player
    
    @type('int8') 
    willWin:number;//win probability of current player for current hand
    
    @type('boolean') 
    isConnected:boolean;//used for reconnection
    
    @type('boolean') 
    isPlaying:boolean;//used to determine if player can play current hand 
    
    @type('boolean') 
    isRemoved:boolean;//used to determine if player left game and we will not except his/her entry

}  
  