import { type,Schema, MapSchema, ArraySchema, Context } from "@colyseus/schema";
import {GameTable} from "./GameTable"
import {Player} from "./Player"
import {DelarData} from "./DelarData"
import {DeckOfCards} from "../Utils/DeckOfCards"

//main game state class covering up all requiremnets for storing players data
export class State extends Schema 
{

    @type(GameTable)
    currentTable:GameTable;//Table details of gametable being played

    @type('uint8') 
    tableIndex:number;//Table Index for current table

    @type(DeckOfCards)
    deck:DeckOfCards;//Used to store single deck of card to initialize deck of cards all oher time

    @type(DeckOfCards)
    remainingDeck:DeckOfCards;//actual deck used to store remaining cards in game and it's being copied from deck object

    @type('int32') 
    currentHandNo:number;//Current hand no. tracker

    @type([Player])
    playersInGame:ArraySchema<Player>;//arrayschema to store all Player/Bot Details 

    @type('int8') 
    CurrentHand:number;//Current hand no. tracker

    @type(DelarData)
    delar:DelarData;//object to hold delar's data

    @type('boolean') 
    BotWinProbability:boolean;//used for determining bot wining probability

    @type('int32') 
    currentTurnOfPlayer:number;//used to track current turn of player/Bot

    @type('int32')
    currentSecondsSpentInTurn:number;//used for storing seconds passed for player's turn
    //it's values becomes -1 while delar's hands play
    
    @type('int32')
    WinnerIndex:number;//used for reconnnection price pool mgmt
    
    @type('int32')
    RunnerupIndex:number;//used for reconnnection price pool mgmt

    @type('boolean')
    isFirstTurnForCurrentPlayer:boolean;//used for indecating weather it's first turn of current turn player or not (used for taking decision and reconnection command display for insure, double)

    @type('string')
    currentGameState:string;//used to determine state of game at a time used for reconnection
    /*
        values of current state --->meaning
        -----------------------------------------------------------------
        roomCreated--first state when just room is created
        WaitingForPlayers-players are in sitting/joining face
        gameStartingForFirstTime-room is locked initializing data
        PreparingForNextHand-preparing for new hand after every hand is finished
        InitialBettingTime-player's have timer for bet
        cardsDistribution-all cards are being distributed
        SplitDuration-user is in Split operaion
        SplitedcardsDistribution-cards are being destributed for player's Split 
        PlayersTurn-player is decision making
        delarsTurn-delar is decision making
        HandResults-showing results for current hand
        PricePoolCalculation-calculating pricepool result
        GameFinished-game is finished and pricepool results are declared
    */
}