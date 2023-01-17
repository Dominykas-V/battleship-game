import express from "express";
import battleShipCTRL from "./battleships.controller.js";

const router = express.Router();

router.route("/").get((req, res) => res.json({ error: "Wrong api call.", res:res }));

router.route("/new_game").get(battleShipCTRL.apiNewGame);
router.route("/hit/:gameId/:coordinates/").get(battleShipCTRL.apiHitSquare);


router.route("/get_all_games").get(battleShipCTRL.apiGetAllGames);

export default router;
