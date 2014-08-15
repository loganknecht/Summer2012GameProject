#pragma strict
/*
This is meant to be a struct object that contains all the types a meta tile
can be. The constructor sets it to the default unless specified otherwise
through the overriden constructor.

To check the type of a struct just call get tile type
*/
class TileType {
	var tileTypes : Hashtable;
	var environmentTypes : Hashtable;
	
	function TileType() {
		tileTypes = new Hashtable();
		configureTileTypes();
		setCurrentTileType("defaultTile");
		
		configureEnvironmentTypes();
	}
	
	function TileType(tileType : String) {
		tileTypes = new Hashtable();
		configureTileTypes();
		setCurrentTileType(tileType);
		
		configureEnvironmentTypes();
	}
	
//	function TileType(tileType : String) {
//		tileTypes = new Hashtable();
//		configureTileTypes();
//		setCurrentTileType(tileType);
//		
//		configureEnvironmentTypes();
//	}
//	
	function setCurrentTileType(tileType : String) {
		if(tileTypes.Contains(tileType)) {
			tileTypes["currentTileType"] = tileType;
		}
	}
	
	function getCurrentTileType() {
		return tileTypes["currentTileType"];
	}
	
	function configureTileTypes() {
		//The current tile
		tileTypes["currentTileType"] = "None";
		
		//Default Tile
		tileTypes["defaultTile"] = "defaultTile";
		
		//Test tiles
		tileTypes["testTileOne"] = "testTileOne";
		tileTypes["testTileTwo"] = "testTileTwo";
	}
	
	function setCurrentEnvironmentType(environmentType : String) {
		if(environmentTypes.Contains(environmentType)) {
			environmentTypes["currentEnvironmentType"] = environmentType;
		}
	}
	
	function getCurrentEnvironmentType() {
		return environmentTypes["currentEnvironmentType"];
	}
	
	function configureEnvironmentTypes() {
		//The current tile
		environmentTypes["currentEnvironmentType"] = "None";
		
		//Default Tile
		environmentTypes["defaultEnvironmentType"] = "defaultEnvironmentType";
		
		//Test tiles
		environmentTypes["building"] = "building";
		environmentTypes["landscape"] = "landscape";
	
	}
}
