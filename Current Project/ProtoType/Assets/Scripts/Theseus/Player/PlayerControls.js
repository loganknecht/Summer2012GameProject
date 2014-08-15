#pragma strict
/*
Oh god... Ok. I just finished writing this so there is a lot that needs to be elaborated on

This is a script that handles all player interaction in the world environment. This is the very CORE of the player 
interactions and shouldn't be expected to deviate from it unless it's being ported, the animation is changed or updated
or something is just being tweaked.

IMPORTANT: This scripts operates on an underlying assumption that there is a plane object with the "AnimatedImage" 
script attached to it that is placed under the object with this player controls attached to it in the hiearchy. This
way the animated image is attached to the controls

TL:DR;
- the player consists of an empty game object, and a plane
	- the empty game object has the 'PlayerControls.js' attached to it
	- the plane has the 'AnimatedImage.js' script attached to it
	- no make sure the plane is on the same x, y, and z as the empty game object
	- lastly when moving this game object only move the empty game object and not the plane, the plane will move with the empty game object

To start off the variables:
moveSpeed - This is a variable that controls how fast the player moves in the horizontal direction
jumpSpeed - this represents how fast the player moves up when they jump

upKey - the key being used for moving up
leftKey - the key being used for moving left
rightKey - the key being used for moving right
downKey - the key being used for moving down
jumpKey - the key being used for jumping

playerGameObject - this is the plane that's attached so that the animated image has something to draw on
animatedImage - this is the animated image script component that is attached to the playerGameObject

private var movingLeft = false;
private var movingRight = false;

isJumping - this is for whenever the player is jumping, it's used to track the state of the player being in the air
jumpUsed - this is used to track if the player already used their first jump of possibly multiple jumps
doubleJumpUsed - this is used to track if the player already used their second jump of possibly multiple jumps
jumpTimerMax - this represents how long to let the player move up when jumping
jumpTimer - this tracks the time the player is up for their jump
doubleJumpTimer - this tracks the time the player is up for their double jump

fallSpeed - this is how fast the player is moved down by the "gravity"
*/
var moveSpeed : float = 2;
var jumpSpeed : float = 3;

var upKey : String = "w";
var downKey : String = "s";
var leftKey : String = "a";
var rightKey : String = "d";

var attackKey : String = "g";
var jumpKey : String = "space";

var planeImageGameObject : GameObject;
var animatedImage : AnimatedImage;

//------------------------------------------------------------------
//move states handled here, maybe pointless but couldn't 
//think of a better way to do this other than how I've been doing it
var pressingUp = false;
var pressingDown = false;

var movingLeft = false;
var movingRight = false;

//jumping bs goes here
var isJumping : boolean = false;
var jumpUsed : boolean = false;
var doubleJumpUsed : boolean = false;
var jumpTimerMax : int = 15;
var jumpTimer : int = 0;
var doubleJumpTimer : int = 0;

//environment bs goes here
var fallSpeed : float = 2;

var movementModifier : Vector3 = Vector3.zero;
var movementModifierDecrementSize : float = 0.5;

//------------------------------------------------------------------

function Start () {
	/*
	Declared the animatedImage that's grabbed from the game object pre-assigned
	*/
	animatedImage = planeImageGameObject.GetComponent(AnimatedImage);
}

function Update() {
	/*
	ALL player input is handled here so that it's as up to date as possible
	*/
	playerEventHandling();
}

function FixedUpdate () {
	/*
	This method is used for physics mainly but for this it's being used for player movement
	
	The first step is to create a new vector that represents the amount int the world to be moving.
	Then this new vector is assigned that value byte calling runPlayerLogic() and grabbing the output
	
	following that the next step is to fix any player collisions that might occur if this vector is used
	So what happens is that the new movement vector gets passed into a fix collisions method and it shoots out
	a bunch of raycasts to verify what move distances are allowable and which ones should just be zeroed out
	
	Finally the output from the fix collisions is returned and then given to the local transform object in order 
	to move
	*/	
	
	var newMovementVector : Vector3 = Vector3.zero;
	//player movement and running junk goes here
	newMovementVector = runPlayerLogic();
	//external forces get added here
	newMovementVector = addMovementModifier(newMovementVector);
	//collision rectifying goes here
	newMovementVector = fixCollisions(newMovementVector);
	//after all this the player now moves to the correct location
	transform.Translate(newMovementVector);
	
	transform.position.z = 0;
}

function addMovementModifier(newMovementVector : Vector3) : Vector3{
	newMovementVector += movementModifier;
	var moveThreshold : float = .5;
	if(movementModifier.x <= moveThreshold && movementModifier.x >= -moveThreshold) {
		movementModifier.x = 0;
	}
	else {
		if(movementModifier.x >= moveThreshold) {
			movementModifier.x -= movementModifierDecrementSize;
		}
		else if (movementModifier.x <= -moveThreshold) {
			movementModifier.x += movementModifierDecrementSize;
		}
	}
	if(movementModifier.y <= moveThreshold && movementModifier.y >= -moveThreshold) {
		movementModifier.y = 0;
	}
	else {
		if(movementModifier.y >= moveThreshold) {
			movementModifier.y -= movementModifierDecrementSize;
		}
		else if (movementModifier.y <= -moveThreshold) {
			movementModifier.y += movementModifierDecrementSize;
		}
	}
	return newMovementVector;	
}

function fixCollisions(movementVector : Vector3) : Vector3 {
	/*
	This function is insane. I apologize.
	
	This function handles all collision for the player. The intent is that this function is responsible
	for shooting multiple raycasts out into the environment so that the player can determine how far a 
	world object is away and then determing how far of a move the player is allowed to make.
	
	There are A LOT of nuances to this function but i may not remember to mark them all down, and i'm 
	sure this could be refactored, but being so verbose with this helps elaborate on the interaction for me
	*/
	// normal rays
	var rightRay : RaycastHit;
	var leftRay : RaycastHit;
	var topRay : RaycastHit;
	var bottomRay : RaycastHit;
	// corner rays
	var topLeftRay : RaycastHit;
	var topRightRay : RaycastHit;
	var bottomLeftRay : RaycastHit;
	var bottomRightRay : RaycastHit;
	// vectors used to represent raycast shoot points
	var topLeftPosition : Vector3;
	var topRightPosition : Vector3;
	var bottomLeftPosition : Vector3;
	var bottomRightPosition : Vector3;
	
	var rayLength : int = 20;
	/*
	This is a mask created by using (1<<9) to create a bit mask that JUST performs collision
	checks on the specified layer 9. Then I complemented it with the '~' symbol in order
	to get a bitmask that performs collision checks on ALL layers EXCEPT the layer 9
	
	kk good talk 
	*/
	var ignoreMask : int = ~(1<<9);
	
	// this helps deterine how far to offset the interaction for collisions so that an object can be as flush as possible
	// if the value being compared to this is greater than it then the move value is allowed, otherwise it's zeroed out
	var moveThreshold : float = 8;
	
	//-------------------------------------------------------
	// ALL COLLISION INTERACTION STARTS BELOW THIS LINE
	//-------------------------------------------------------
	/*
	The collision checking is down in a mutally exclusive fashion. Such that the collision with only be check in one direction for 
	horizontal movement and likewise for vertical movement. This is because you can't be going left AND right at the same time
	
	First the horizontal movement is check, followed by the vertical movment
	
	Raycasts are not used in the left direction or the right direction at the base of the player. This is 
	done in order to facilitate the player being able to move up and down slopes as well as varied platforms
	that are connected.
	
	The raycasts for the top right and left corners that are shot up are positioned further inward so that the
	player can jump up on platforms and not get clipped on the corners as they move up
	
	Almost all raycast checks follow the EXACT same pattern
	- check if a ray cast hits in a direction
	- if it hits check if the distance to the point that it hit is less than the player's intended move direction
		- this means the players move would be big enough to move on or into the object it hit
	- next check if it's over the threshold that is used to determine when to just zero it out
		- if it's over the threshhold then just half the distance
		- if it's less than the thresshold then just zero out the distance
		
	I'm aware the way this works out is that the vector in a direction may be halved multiple times
	But... at this point I just don't care. Call it a sextenary search or someting...
	*/
	
	transform.rotation = Quaternion.identity;
	//moving left
	if(movementVector.x <= 0) {
		//top left
		topLeftPosition = new Vector3(transform.position.x, transform.position.y + collider.bounds.size.y/2, transform.position.z);
		bottomLeftPosition = new Vector3(transform.position.x, transform.position.y - collider.bounds.size.y/2, transform.position.z);
		if (Physics.Raycast(topLeftPosition, -Vector3.right, topLeftRay, rayLength, ignoreMask)) {
			if(topLeftRay.collider.gameObject.name.ToLower() == "whippart") {
			}
			else if(topLeftRay.collider.gameObject.name.ToLower() == "spring") {
			}
			else {
				if(topLeftRay.distance <= -(movementVector.x - collider.bounds.size.x/2)) {
					if(-movementVector.x > moveThreshold) {
						movementVector.x = movementVector.x/2;
					}
					else {
						movementVector.x = -topLeftRay.distance + collider.bounds.size.x/2;
					}
					
				}
			}
		}
		//left
		//Debug.DrawRay(transform.position, -Vector3.right*movementVector.x, Color.white);
		if (Physics.Raycast(transform.position, -Vector3.right, leftRay, rayLength, ignoreMask)) {
			if(leftRay.collider.gameObject.name.ToLower() == "whippart") {
			}
			else if(leftRay.collider.gameObject.name.ToLower() == "spring") {
			}
			else {
				if(leftRay.distance <= -(movementVector.x - collider.bounds.size.x/2)) {
					if(-movementVector.x > moveThreshold) {
						movementVector.x = movementVector.x/2;
					}
					else {
						movementVector.x = -leftRay.distance + collider.bounds.size.x/2;
					}
				}
			}
		}
	}
	//moving right
	else {
		//top right
		topRightPosition = new Vector3(transform.position.x, transform.position.y + collider.bounds.size.y/2, transform.position.z);
		bottomRightPosition = new Vector3(transform.position.x, transform.position.y - collider.bounds.size.y/2, transform.position.z);
		if (Physics.Raycast(topRightPosition, Vector3.right, topRightRay, rayLength, ignoreMask)) {
			if(topRightRay.collider.gameObject.name.ToLower() == "whippart") {
			}
			else if(topRightRay.collider.gameObject.name.ToLower() == "spring") {
			}
			else {
				if(topRightRay.distance <= (movementVector.x + collider.bounds.size.x/2)) {
					if(movementVector.x > moveThreshold) {
						movementVector.x = movementVector.x/2;
					}
					else {
						movementVector.x = topRightRay.distance-collider.bounds.size.x/2;
					}
				}
			}
		}
		//right
		//Debug.DrawRay(transform.position, Vector3.right*movementVector.x, Color.white);
		if (Physics.Raycast(transform.position, Vector3.right, rightRay, rayLength, ignoreMask)) {
			if(rightRay.collider.gameObject.name.ToLower() == "whippart") {
			}
			else if(rightRay.collider.gameObject.name.ToLower() == "spring") {
			}
			else {
				if(rightRay.distance <= (movementVector.x + collider.bounds.size.x/2)) {
					//movementVector.x = movementVector.x/2;
					if(movementVector.x > moveThreshold) {
						movementVector.x = movementVector.x/2;
					}
					else {
						movementVector.x = rightRay.distance-collider.bounds.size.x/2;
					}
				}
			}
		}
	}
	//moving up
	if(movementVector.y >= 0) {
		topLeftPosition = new Vector3(transform.position.x - collider.bounds.size.x/2.5, transform.position.y, transform.position.z);
		topRightPosition = new Vector3(transform.position.x + collider.bounds.size.x/2.5, transform.position.y, transform.position.z);
		//top left
		if (Physics.Raycast(topLeftPosition, Vector3.up, topLeftRay, rayLength, ignoreMask)) {
			if(topLeftRay.collider.gameObject.name.ToLower() == "whippart") {
			}
			else if(topLeftRay.collider.gameObject.name.ToLower() == "spring") {
			}
			else {
				if(topLeftRay.distance <= (movementVector.y + collider.bounds.size.y/2)) {
					if(movementVector.y > moveThreshold) {
						movementVector.y = movementVector.y/2;
					}
					else {
						movementVector.y = topLeftRay.distance - collider.bounds.size.y/2;
					}
					if(isJumping) {
						isJumping = false;
						jumpUsed = true;
					}
				}
			}
		}
		//top
		//Debug.DrawRay(transform.position, Vector3.up*movementVector.y, Color.white);
		if (Physics.Raycast(transform.position, Vector3.up, topRay, rayLength, ignoreMask)) {
			if(topRay.collider.gameObject.name.ToLower() == "whippart") {
			}
			else if(topRay.collider.gameObject.name.ToLower() == "spring") {
			}
			else {
				if(topRay.distance <= (movementVector.y + collider.bounds.size.y/2)) {
					if(movementVector.y > moveThreshold) {
						movementVector.y = movementVector.y/2;
					}
					else {
						movementVector.y = topRay.distance - collider.bounds.size.y/2;
					}
					if(isJumping) {
						isJumping = false;
						jumpUsed = true;
					}
				}
			}
		}
		//top right
		if (Physics.Raycast(topRightPosition, Vector3.up, topRightRay, rayLength, ignoreMask)) {
			if(topRightRay.collider.gameObject.name.ToLower() == "whippart") {
			}
			else if(topRightRay.collider.gameObject.name.ToLower() == "spring") {
			}
			else {
				if(topRightRay.distance <= (movementVector.y + collider.bounds.size.y/2)) {
					if(movementVector.y > moveThreshold) {
						movementVector.y = movementVector.y/2;
					}
					else {
						movementVector.y = topRightRay.distance - collider.bounds.size.y/2;
					}
					if(isJumping) {
						isJumping = false;
						jumpUsed = true;
					}
				}
			}
		}
	}
	//moving down
	else {
		bottomLeftPosition = new Vector3(transform.position.x - collider.bounds.size.x/2.1, transform.position.y, transform.position.z);
		bottomRightPosition = new Vector3(transform.position.x + collider.bounds.size.x/2.1, transform.position.y, transform.position.z);
		
		//down
		//Debug.DrawRay(transform.position, -Vector3.up, Color.white);
		if (Physics.Raycast(transform.position, -Vector3.up, bottomRay, rayLength, ignoreMask)) {
			if(bottomRay.distance <= -(movementVector.y - collider.bounds.size.y/2)) {
				if(bottomRay.collider.gameObject.name.ToLower() == "whippart") {
				}
				else if(bottomRay.collider.gameObject.name.ToLower() == "spring") {
				}
				else {
					if(-movementVector.y > moveThreshold) {
						movementVector.y = movementVector.y/2;
					}
					else {
						movementVector.y = -(bottomRay.distance - collider.bounds.size.y/2);
					}
					if(jumpUsed || isJumping) {
						resetJump();
						if(movingRight || movingLeft) {
							animatedImage.animateOver(19, 19, 28);
						}
						else {
							animatedImage.animateOver(0, 0, 4);
						}
					}
				}
			}
		}
		
		//left-down
		if (Physics.Raycast(bottomLeftPosition, -Vector3.up, bottomLeftRay, rayLength, ignoreMask)) {
			if(bottomLeftRay.distance <= -(movementVector.y - collider.bounds.size.y/2)) {
				if(bottomLeftRay.collider.gameObject.name.ToLower() == "whippart") {
				}
				else if(bottomLeftRay.collider.gameObject.name.ToLower() == "spring") {
				}
				else {
					if(-movementVector.y > moveThreshold) {
						movementVector.y = movementVector.y/2;
					}
					else {
						movementVector.y = -(bottomLeftRay.distance - collider.bounds.size.y/2);
					}
					if(jumpUsed || isJumping) {
						resetJump();
						if(movingRight || movingLeft) {
							animatedImage.animateOver(19, 19, 28);
						}
						else {
							animatedImage.animateOver(0, 0, 4);
						}
					}
				}
			}
		}
		//left-mid-down
		var bottomMideLeftPosition = new Vector3(transform.position.x - collider.bounds.size.x/4, transform.position.y, transform.position.z);
		if (Physics.Raycast(bottomMideLeftPosition, -Vector3.up, bottomLeftRay, rayLength, ignoreMask)) {
			if(bottomLeftRay.distance <= -(movementVector.y - collider.bounds.size.y/2)) {		
				if(bottomLeftRay.collider.gameObject.name.ToLower() == "whippart") {
				}
				else if(bottomLeftRay.collider.gameObject.name.ToLower() == "spring") {
				}
				else {
					if(-movementVector.y > moveThreshold) {
						movementVector.y = movementVector.y/2;
					}
					else {
						movementVector.y = -(bottomLeftRay.distance - collider.bounds.size.y/2);
					}
					if(jumpUsed || isJumping) {
						resetJump();
						if(movingRight || movingLeft) {
							animatedImage.animateOver(19, 19, 28);
						}
						else {
							animatedImage.animateOver(0, 0, 4);
						}
					}
				}
			}
		}
		//right-down
		//Debug.DrawRay(bottomRightPosition, -Vector3.up*5, Color.white);
		if (Physics.Raycast(bottomRightPosition, -Vector3.up, bottomRightRay, rayLength, ignoreMask)) {
			if(bottomRightRay.distance <= -(movementVector.y - collider.bounds.size.y/2)) {				
				if(bottomRightRay.collider.gameObject.name.ToLower() == "whippart") {
				}
				else if(bottomRightRay.collider.gameObject.name.ToLower() == "spring") {
				}
				else {
					if(-movementVector.y > moveThreshold) {
						movementVector.y = movementVector.y/2;
					}
					else {
						movementVector.y = -(bottomRightRay.distance - collider.bounds.size.y/2);
					}
					if(jumpUsed || isJumping) {
						resetJump();
						if(movingRight || movingLeft) {
							animatedImage.animateOver(19, 19, 28);
						}
						else {
							animatedImage.animateOver(0, 0, 4);
						}
					}
				}
			}
		}
		//right-mid-down
		//Debug.DrawRay(bottomRightPosition, -Vector3.up*5, Color.white);
		var bottomMidRightPosition = new Vector3(transform.position.x + collider.bounds.size.x/4, transform.position.y, transform.position.z);
		if (Physics.Raycast(bottomMidRightPosition, -Vector3.up, bottomRightRay, rayLength, ignoreMask)) {
			if(bottomRightRay.distance <= -(movementVector.y - collider.bounds.size.y/2)) {
				if(bottomRightRay.collider.gameObject.name.ToLower() == "whippart") {
				}
				else if(bottomRightRay.collider.gameObject.name.ToLower() == "spring") {
				}
				else {
					if(-movementVector.y > moveThreshold) {
						movementVector.y = movementVector.y/2;
					}
					else {
						movementVector.y = -(bottomRightRay.distance - collider.bounds.size.y/2);
					}
					if(jumpUsed || isJumping) {
						resetJump();
						if(movingRight || movingLeft) {
							animatedImage.animateOver(19, 19, 28);
						}
						else {
							animatedImage.animateOver(0, 0, 4);
						}
					}
				}
			}
		}
	}

	//---------------------------------------------------------------------------------------------------------------
	//IMPORTANT
	//This handles the player rotation and helps make it so that the player is consistent on most platform orientations
	
	//middle-down
	//var vectorOffset : Vector3 = Vector3.zero;
	//vectorOffset.y -= collider.bounds.size.y/2;
	if (Physics.Raycast(transform.position, -Vector3.up, bottomRay)) {
		if(bottomRay.collider.gameObject.name.ToLower() == "whippart") {
		}
		else if(bottomRay.collider.gameObject.name.ToLower() == "spring") {
		}
		else {
			if(bottomRay.distance <= -(movementVector.y - collider.bounds.size.y)) {
				transform.rotation = Quaternion.Euler(new Vector3(0, 0, bottomRay.transform.rotation.eulerAngles.z));
			}
			if(!isJumping) {
				//fix player rotation
				if(transform.rotation.eulerAngles.z >= 310 && transform.rotation.eulerAngles.z < 320) {
					movementVector.y -= 2;
				}
				else if(transform.rotation.eulerAngles.z >= 320 && transform.rotation.eulerAngles.z < 330) {
					movementVector.y -= 1.5;
				}
				else if(transform.rotation.eulerAngles.z >= 330 && transform.rotation.eulerAngles.z < 340) {
					movementVector.y -= 1;
				}
				else if(transform.rotation.eulerAngles.z >= 340 && transform.rotation.eulerAngles.z < 350) {
					movementVector.y -= .5;
				}
				else if(transform.rotation.eulerAngles.z >= 350 && transform.rotation.eulerAngles.z < 355) {
					movementVector.y -= .5;
				}
			}
		}
	}

	//END PLAYER ROTATION CODE
	//---------------------------------------------------------------------------------------------------------------
	return movementVector;
}

function playerEventHandling() {
	//------left-------
	//if left key pressed and right key not held
	if(Input.GetKeyDown(leftKey)) {
		if(!animatedImage.flipImage) {
			animatedImage.setFlipImage(true);
		}
		if(!(isJumping || jumpUsed)) {
			animatedImage.animateOver(19, 19, 28);
		}
		movingLeft = true;
		movingRight = false;
	}
	//if left key pressed and right key held
	if(Input.GetKeyDown(leftKey) && Input.GetKey(rightKey)) {
		if(!animatedImage.flipImage) {
			animatedImage.setFlipImage(true);
		}
		if(!(isJumping || jumpUsed)) {
			animatedImage.animateOver(19, 19, 28);
		}
		movingLeft = true;
		movingRight = false;
	}
	//if left key held and right key released
	if(Input.GetKey(leftKey) && Input.GetKeyUp(rightKey)) {
		if(!animatedImage.flipImage) {
			animatedImage.setFlipImage(true);
		}
		if(!(isJumping || jumpUsed)) {
			animatedImage.animateOver(19, 19, 28);
		}
		movingLeft = true;
		movingRight = false;
	}
	//if left key released
	if(Input.GetKeyUp(leftKey)) {
		movingLeft = false;
		if(isPlayerStanding()) { 
			animatedImage.animateOver(0, 0, 4);
		}
	}	
	//----------------------
	
	//------right-------
	//right key pressed, left key not held
	if(Input.GetKeyDown(rightKey) && !Input.GetKey(leftKey)) {
		if(animatedImage.flipImage) {
			animatedImage.setFlipImage(false);
		}
		if(!(isJumping || jumpUsed)) {
			animatedImage.animateOver(19, 19, 28);
		}
		movingRight = true;
		movingLeft =false;
	}
	//right key press, left key held
	if(Input.GetKeyDown(rightKey) && Input.GetKey(leftKey)) {	
		if(animatedImage.flipImage) {
			animatedImage.setFlipImage(false);
		}
		if(!(isJumping || jumpUsed)) {
			animatedImage.animateOver(19, 19, 28);
		}
		movingRight = true;
		movingLeft =false;
	}
	//right key held, left key released
	if(Input.GetKey(rightKey) && Input.GetKeyUp(leftKey)) {	
		if(animatedImage.flipImage) {
			animatedImage.setFlipImage(false);
		}
		if(!(isJumping || jumpUsed)) {
			animatedImage.animateOver(19, 19, 28);
		}
		movingRight = true;
		movingLeft = false;
	}
	//if right key released
	if(Input.GetKeyUp(rightKey)) {
		movingRight = false;
		if(isPlayerStanding()) { 
			animatedImage.animateOver(0, 0, 4); 
		}
	}
	//----------------------
	
	//------ up key -------
	//up key pressed
	if(Input.GetKeyDown(upKey)) {
		pressingUp = true;
	}
	//if up key released
	if(Input.GetKeyUp(upKey)) {
		pressingUp = false;
	}
	//----------------------
	
	//------ down key -------
	//up key pressed
	if(Input.GetKeyDown(downKey)) {
		pressingDown = true;
	}
	//if up key released
	if(Input.GetKeyUp(downKey)) {
		pressingDown = false;
	}
	//----------------------
	
	//------jumping-------
	if(Input.GetKeyDown(jumpKey)) {
		// fixes rotation when on hills... and stuff
		transform.rotation = Quaternion.identity;

		//-----
		if(!jumpUsed) {
			isJumping = true;
			jumpTimer = 0;
			animatedImage.animateOnceAndStopAtEnd(37, 37, 39);
		}
	}
	if(Input.GetKeyUp(jumpKey)) {
		if(isJumping) {
			isJumping = false;
			jumpUsed = true;
			animatedImage.animateOnceAndStopAtEnd(39, 39, 41);
		}
	}
	//----------------------
}

function runPlayerLogic() : Vector3 {
	var moveDirection = Vector3(0, 0, 0);
	
	if(isJumping && !jumpUsed) {
		if(doubleJumpUsed) {
			moveDirection.y += jumpSpeed;
		}
		else {
			//Debug.Log("omg jumping");
			moveDirection.y += jumpSpeed;
		}
		if(jumpTimer < jumpTimerMax) {
			jumpTimer++;
		}
		else {
			isJumping = false;
			jumpUsed = true;
			animatedImage.animateOnceAndStopAtEnd(39, 39, 41);
		}
	}
	
	if((movingLeft || movingRight) && !(movingLeft && movingRight)) {
		if(movingLeft) {
			moveDirection.x -= moveSpeed;
		}
		if(movingRight) {
			moveDirection.x += moveSpeed;
		}
	}
	
	//applies gravity
	if(!isJumping) {
		moveDirection.y -= fallSpeed;
	}
	return moveDirection;
}

function rotatePlayerOnCurrentSurface(movementVector : Vector3) {
	var bottomRay : RaycastHit;
	if (Physics.Raycast(transform.position, -Vector3.up, bottomRay)) {
		if(bottomRay.distance <= -(movementVector.y - collider.bounds.size.y/2)) {
			transform.rotation = Quaternion.identity;
			transform.rotation = Quaternion.Euler(new Vector3(0, 0, bottomRay.transform.rotation.eulerAngles.z));
		}
	}

}

function resetJump() {
	jumpTimer = 0;
	isJumping = false;
	jumpUsed = false;
	doubleJumpTimer = 0;
	doubleJumpUsed = false;
}

function isPlayerStanding() {
	if(!movingLeft && !movingRight && !isJumping && !jumpUsed) {
		return true;
	}
	else {
		return false;
	}
}