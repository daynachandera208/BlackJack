import { type,Schema, MapSchema, ArraySchema, Context } from "@colyseus/schema";
import {GameTable} from "./GameTable"
import {Player} from "./Player"
import {DelarData} from "./DelarData"
import {DeckOfCards} from "./DeckOfCards"

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
    }