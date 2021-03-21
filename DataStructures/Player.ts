import { type,Schema, MapSchema, ArraySchema, Context } from "@colyseus/schema";
import {PlayerHandData} from "./PlayerHandData"
export class Player extends Schema{
    Player(p:any){
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
    @type('boolean') isPlaying:boolean;
    @type('boolean') isRemoved:boolean;
}  
  