#pragma strict
/*
WhipController Notes

This is a script made to be attached to an empty game object

Once attached to an empty game object the attackKey triggers the change for this script. 
Upong pressing the attack key the state is changed on the basis of what keys are pressed 
on the keyboard as well as the direction that the player is pointing towards.

whip - this is the container for the whip sphere parts
whipLength - sets the amount of spheres to have in the whip
whipScale -  this manages the whip's scale
whipHeldTimer - tracks how long to hold the whip in the initial whip position that is set upon pressing the attack key
whipHeldTimerMax - this is the maximum amount of time to hold the whip in its initial position for

playerReference - this is the reference to the player object that the whip should be attached to
playerReferenceControls - this is the script that is used for the player controller;

attackKey - this is the key that needs to be pressed in order to attack
isAttacking - tracks the player's attacking state
*/
var whip : WhipPart[];
var whipLength : int = 6;
var whipScale : Vector3 = new Vector3(1, 1, 1);
var whipFallSpeed : float = -1;
var whipHeldTimer : int = 0;
var whipHeldTimerMax : int = 20;
var distanceBetweenWhipParts : float = 1;

var playerReference : GameObject;
var playerReferenceControls : PlayerControls;

var attackKey : String = "g";
var isAttacking = false;

function Start () {
	//initializes the whip to contain the spheres specified
	whip = new WhipPart[whipLength];
	//grabs the reference to the player's controls
	playerReferenceControls = playerReference.GetComponent(PlayerControls);
}

function FixedUpdate() {
	manageWhipHeldTimer();
	performWhipMovement();
	fixFirstWhipPointLocation();
	fixWhipPartConstraints();
	performWhipCollisionHandling();
}

function Update () {
	//handles key presses from the player
	performKeyPressEventHandling();
}

//perform whip movement
function performWhipMovement() {
	var whipPartRadius : float = .5;
	
	var velocityToCheck : Vector3 = Vector3.zero;
	
	var topRay : RaycastHit;
	var bottomRay : RaycastHit;
	
	var leftRay : RaycastHit;
	var rightRay : RaycastHit;
	
	var rayLength : int = 10;
	
	var ignoreMask : int = ~((1<<8) | (1<<9));
	
	var i : int = 0;	
	while(i < whip.Length) {
		if(whip[i] != null) {
			velocityToCheck = whip[i].velocity;
			
			//velocity is going up
			if(velocityToCheck.y > 0) {
				//top
				if (Physics.SphereCast(whip[i].object.transform.position, whipPartRadius, Vector3.up, topRay, rayLength, ignoreMask)) {
					if(topRay.distance < whip[i].object.renderer.bounds.size.y/2 + velocityToCheck.y) {
						velocityToCheck.y = topRay.distance;
					}
				}
			}
			//velocity is going down
			else {
				//bottom
				if (Physics.SphereCast(whip[i].object.transform.position, whipPartRadius, -Vector3.up, bottomRay, rayLength, ignoreMask)) {
					if(bottomRay.distance < whip[i].object.renderer.bounds.size.y/2 - velocityToCheck.y) {
						velocityToCheck.y = -bottomRay.distance;
					}
				}		
			}
			//velocity is going left
			if(velocityToCheck.x < 0) {
				//left
				if (Physics.SphereCast(whip[i].object.transform.position, whipPartRadius, -Vector3.right, leftRay, rayLength, ignoreMask)) {
					if(leftRay.distance < whip[i].object.renderer.bounds.size.x/2 - velocityToCheck.x) {
						velocityToCheck.x = -leftRay.distance;
					}
				}			
			}
			//velocity is going right
			else {
				//right
				if (Physics.SphereCast(whip[i].object.transform.position, whipPartRadius, Vector3.right, rightRay, rayLength, ignoreMask)) {
					if(rightRay.distance < whip[i].object.renderer.bounds.size.x/2 + velocityToCheck.x) {
						velocityToCheck.x = rightRay.distance;
					}
				}
			}			
			//whip[i].object.transform.position += whip[i].velocity;
			whip[i].object.transform.position += velocityToCheck;
		}
		i++;
	}
}

//handles key press reaction
function performKeyPressEventHandling() {
	//--------attacking-----------
	if(Input.GetKeyDown(attackKey)) {
		//resets this so whip will drop correctly
		whipHeldTimer = 0;
		
		//creates whip
		generateWhip();
		
		isAttacking = true;
	}
	if(Input.GetKeyUp(attackKey)) {
		//kills whip components
		destroyWhip();
		
		isAttacking = false;
	}
	//----------------------------
}

function performWhipCollisionHandling() {
	/*
	Kind of winging it here.... what i'm doing is making a physics/collision response that allows for the whip
	particles to stay tethered together. In doing this the first initial step is to take the planes of the 
	intersection and calculate the distance between it
	*/
	var whipElasticity : float = 0;
	
	var whipPartRadius : float = .5;
	
	var topRay : RaycastHit;
	var bottomRay : RaycastHit;
	
	var leftRay : RaycastHit;
	var rightRay : RaycastHit;
	
	var rayLength : int = 10;
	
	var ignoreMask : int = ~((1<<8) | (1<<9));
	
	var i : int = 0;	
	while(i < whip.Length) {
		if(whip[i] != null) {			
			//left
			if (Physics.SphereCast(whip[i].object.transform.position, whipPartRadius, -Vector3.right, leftRay, rayLength, ignoreMask)) {
				if(leftRay.distance < whip[i].object.renderer.bounds.size.x/2) {
					//Debug.Log("Whip part " + i + " left hit.");
					whip[i].velocity -= ((1 + whipElasticity) * leftRay.normal * Vector3.Dot(whip[i].velocity, leftRay.normal));
				}
			}
			//right
			if (Physics.SphereCast(whip[i].object.transform.position, whipPartRadius, Vector3.right, rightRay, rayLength, ignoreMask)) {
				if(rightRay.distance < whip[i].object.renderer.bounds.size.x/2) {
					//Debug.Log("Whip part " + i + " right hit.");
					whip[i].velocity -= ((1 + whipElasticity) * rightRay.normal * Vector3.Dot(whip[i].velocity, rightRay.normal));
				}
			}
			//top
			if (Physics.SphereCast(whip[i].object.transform.position, whipPartRadius, Vector3.up, topRay, rayLength, ignoreMask)) {
				if(topRay.distance < whip[i].object.renderer.bounds.size.y/2) {
					//Debug.Log("Whip part " + i + " top hit.");
					whip[i].velocity -= ((1 + whipElasticity) * topRay.normal * Vector3.Dot(whip[i].velocity, topRay.normal));
				}
			}
			//bottom
			if (Physics.SphereCast(whip[i].object.transform.position, whipPartRadius, -Vector3.up, bottomRay, rayLength, ignoreMask)) {
				if(bottomRay.distance < whip[i].object.renderer.bounds.size.y/2) {
					//Debug.Log("Whip part " + i + " bottom hit.");
					whip[i].velocity -= ((1 + whipElasticity) * bottomRay.normal * Vector3.Dot(whip[i].velocity, bottomRay.normal));
				}
			}
			whip[i].object.transform.position.z = 0;
		}
		i++;
	}
}

/*
This runs the logic of the whip. It runs a few things in it

The first few lines runs a check to see if it should enable gravity for the whip components

The second set reorients the whip to be in the location that the player is pointing towards.

The third fixes each whip component to be only so far away from its previous whip component
*/
function fixFirstWhipPointLocation() {
	if(whip[0] != null) {
		//this resets the player rotation and stores its rotation in a variable, then after all this code is run it resets the rotations
		var playerRotation : Quaternion = playerReference.transform.rotation;
		playerReference.transform.rotation = Quaternion.identity;
	
		//-------------- handles re-orienting the whip in the right location around the player, based on key presses -------------------
		//if pressing up
		if(playerReferenceControls.pressingUp) {
			//up and left
			if(playerReferenceControls.movingLeft && !playerReferenceControls.movingRight) {
				whip[0].object.transform.position = new Vector3(playerReference.transform.position.x - whipScale.x/2 - playerReference.transform.collider.bounds.size.x/2,
													  playerReference.transform.position.y + whipScale.y/2 + playerReference.transform.collider.bounds.size.y/2,
													  playerReference.transform.position.z);
			}
			//up and right
			else if(playerReferenceControls.movingRight && !playerReferenceControls.movingLeft) {
				whip[0].object.transform.position = new Vector3(playerReference.transform.position.x + whipScale.x/2 + playerReference.transform.collider.bounds.size.x/2,
												  playerReference.transform.position.y + whipScale.y/2 + playerReference.transform.collider.bounds.size.y/2,
												  playerReference.transform.position.z);
			}
			//just pointing straight up
			else {
				whip[0].object.transform.position = new Vector3(playerReference.transform.position.x,
												  playerReference.transform.position.y + whipScale.y/2 + playerReference.transform.collider.bounds.size.y/2,
												  playerReference.transform.position.z);
			}
		}
		//if pressing down
		else if(playerReferenceControls.pressingDown) {
			//down and left
			if(playerReferenceControls.movingLeft && !playerReferenceControls.movingRight) {
				whip[0].object.transform.position = new Vector3(playerReference.transform.position.x - whipScale.x/2 - playerReference.transform.collider.bounds.size.x/2,
													  	 playerReference.transform.position.y,
													  	 playerReference.transform.position.z);
			}
			//down and right
			else if(playerReferenceControls.movingRight && !playerReferenceControls.movingLeft) {
				whip[0].object.transform.position = new Vector3(playerReference.transform.position.x + whipScale.x/2 + playerReference.transform.collider.bounds.size.x/2,
												  		 playerReference.transform.position.y,
												  		 playerReference.transform.position.z);
			}
			//just pointing straight down
			else {
				if(!playerReferenceControls.movingLeft && !playerReferenceControls.movingRight && (playerReferenceControls.jumpUsed || playerReferenceControls.isJumping)) {
					whip[0].object.transform.position = new Vector3(playerReference.transform.position.x,
													  		 playerReference.transform.position.y - whipScale.y/2 - playerReference.transform.collider.bounds.size.y/2,
													  		 playerReference.transform.position.z);
				}
				else {
					//facing left
					if(playerReferenceControls.animatedImage.transform.localScale.x > 0) {
						whip[0].object.transform.position = new Vector3(playerReference.transform.position.x - whipScale.x/2 - playerReference.transform.collider.bounds.size.x/2,
														  		 playerReference.transform.position.y,
														  		 playerReference.transform.position.z);
					}
					//facing right
					else {
						whip[0].object.transform.position = new Vector3(playerReference.transform.position.x + whipScale.x/2 + playerReference.transform.collider.bounds.size.x/2,
														  		 playerReference.transform.position.y,
														  		 playerReference.transform.position.z);
					}
				}
			}
		}
		//if not pressing up or down
		else {
			//if facing left
			if(playerReferenceControls.animatedImage.transform.localScale.x > 0) {
				whip[0].object.transform.position = new Vector3(playerReference.transform.position.x - whipScale.x/2 - playerReference.transform.collider.bounds.size.x/2,
									  					playerReference.transform.position.y,
									  					playerReference.transform.position.z);
			}
			//facing right
			else {
				whip[0].object.transform.position = new Vector3(playerReference.transform.position.x + whipScale.x/2 + playerReference.transform.collider.bounds.size.x/2,
									  					playerReference.transform.position.y,
									  					playerReference.transform.position.z);
			}
		}
		//--------------------------
		
		//resets rotation because only the first portion of the whip needs to be reset with the player
		playerReference.transform.rotation = playerRotation;
	}
}

function generateWhip() {

	//attaches the whip in world space to the player
	transform.parent = playerReference.transform;
	transform.localPosition=Vector3.zero;
	transform.localRotation=Quaternion.identity;
	
	var i : int = 0;
	
	var whipPartXSpeed : float = 1;
	var whipPartYSpeed : float = 1;
	var whipPartInitialVelocity : Vector3 = Vector3.zero;
	
	var whipPartNewPosition : Vector3;

	var playerRotation : Quaternion = playerReference.transform.rotation;
	playerReference.transform.rotation = Quaternion.identity;
	
	while(i < whipLength) {		 
		whipPartNewPosition = Vector3.zero;
		//if pressing up
		if(playerReferenceControls.pressingUp) {
			//up and left
			if(playerReferenceControls.movingLeft && !playerReferenceControls.movingRight) {
				whipPartNewPosition = new Vector3(playerReference.transform.position.x - (whipScale.x * (i+1)) - playerReference.transform.collider.bounds.size.x/2,
													  playerReference.transform.position.y + (whipScale.y * (i+1)) + playerReference.transform.collider.bounds.size.y/2,
													  playerReference.transform.position.z);
			  	whipPartInitialVelocity = new Vector3(-whipPartXSpeed, whipPartYSpeed, 0);
			}
			//up and right
			else if(playerReferenceControls.movingRight && !playerReferenceControls.movingLeft) {
				whipPartNewPosition = new Vector3(playerReference.transform.position.x + (whipScale.x * (i+1)) + playerReference.transform.collider.bounds.size.x/2,
												  playerReference.transform.position.y + (whipScale.y * (i+1)) + playerReference.transform.collider.bounds.size.y/2,
												  playerReference.transform.position.z);
			  whipPartInitialVelocity = new Vector3(whipPartXSpeed, whipPartYSpeed, 0);
			}
			//just pointing straight up
			else {
				whipPartNewPosition = new Vector3(playerReference.transform.position.x,
												  playerReference.transform.position.y + (whipScale.y * (i+1)) + playerReference.transform.collider.bounds.size.y/2,
												  playerReference.transform.position.z);
				whipPartInitialVelocity = new Vector3(0, whipPartYSpeed, 0);
			}
		}
		//if pressing down
		else if(playerReferenceControls.pressingDown) {			
			//if(playerReferenceControls.pressingDown && !playerReferenceControls.movingLeft && !playerReferenceControls.movingLeft) {
			//straight down
			if(playerReferenceControls.pressingDown && 
			   !playerReferenceControls.movingLeft && 
			   !playerReferenceControls.movingRight &&
			   (playerReferenceControls.jumpUsed || playerReferenceControls.isJumping)) {
		   		whipPartNewPosition = new Vector3(playerReference.transform.position.x,
												  playerReference.transform.position.y - (whipScale.y * (i+1)) - playerReference.transform.collider.bounds.size.y/2,
						  						  playerReference.transform.position.z);
				whipPartInitialVelocity = new Vector3(0, -whipPartYSpeed, 0);
			}
			else {
				var downWhipRayHit : RaycastHit;
				//left down
				if(playerReferenceControls.animatedImage.transform.localScale.x > 0) {
					if (Physics.Raycast(playerReference.transform.position, -Vector3.up, downWhipRayHit)) {
						if(downWhipRayHit.distance < whipScale.y*whip.Length) {
							//if distance is lesser than distance to ground
							whipPartNewPosition = new Vector3(playerReference.transform.position.x - (whipScale.x * (i+1)) - playerReference.transform.collider.bounds.size.x/2,
															  playerReference.transform.position.y - (parseFloat(downWhipRayHit.distance/whipLength) * (i+1)),
															  playerReference.transform.position.z);
						}
						else {
							//if distance is greater than distance to ground
							whipPartNewPosition = new Vector3(playerReference.transform.position.x - (whipScale.x * (i+1)) - playerReference.transform.collider.bounds.size.x/2,
															  playerReference.transform.position.y - (whipScale.y * (i+1)),
															  playerReference.transform.position.z);
						}
					}
					else {
						//if distance is greater than distance to ground
						whipPartNewPosition = new Vector3(playerReference.transform.position.x - (whipScale.x * (i+1)) - playerReference.transform.collider.bounds.size.x/2,
														  playerReference.transform.position.y - (whipScale.y * (i+1)),
														  playerReference.transform.position.z);	
					}
					whipPartInitialVelocity = new Vector3(-whipPartXSpeed, -whipPartYSpeed, 0);
				}
				//right down
				else {
					if (Physics.Raycast(playerReference.transform.position, -Vector3.up, downWhipRayHit)) {
						if(downWhipRayHit.distance < whipScale.y*whip.Length) {
							//if distance is less than distance to ground
							whipPartNewPosition = new Vector3(playerReference.transform.position.x + (whipScale.x * (i+1)) + playerReference.transform.collider.bounds.size.x/2,
															  playerReference.transform.position.y - (parseFloat(downWhipRayHit.distance/whipLength) * (i+1)),
															  playerReference.transform.position.z);
						}
						else {
							//if distance is greater than distance to ground
							whipPartNewPosition = new Vector3(playerReference.transform.position.x + (whipScale.x * (i+1)) + playerReference.transform.collider.bounds.size.x/2,
															  playerReference.transform.position.y - (whipScale.y * (i+1)),
															  playerReference.transform.position.z);
						}
					}
					else {
						//if distance is greater than distance to ground
						whipPartNewPosition = new Vector3(playerReference.transform.position.x + (whipScale.x * (i+1)) + playerReference.transform.collider.bounds.size.x/2,
														  playerReference.transform.position.y - (whipScale.y * (i+1)),
														  playerReference.transform.position.z);
					}
					whipPartInitialVelocity = new Vector3(whipPartXSpeed, -whipPartYSpeed, 0);
				}
			}
		}
		//if not pressing down or up
		else {
			//facing left
			if(playerReferenceControls.animatedImage.transform.localScale.x > 0) {
				whipPartNewPosition = new Vector3(playerReference.transform.position.x - (whipScale.x * (i+1)) - playerReference.transform.collider.bounds.size.x/2,
													  playerReference.transform.position.y,
													  playerReference.transform.position.z);
				whipPartInitialVelocity = new Vector3(-whipPartXSpeed, 0, 0);
			}
			//facing right
			else {
				whipPartNewPosition = new Vector3(playerReference.transform.position.x + (whipScale.x * (i+1)) + playerReference.transform.collider.bounds.size.x/2,
												  playerReference.transform.position.y,
												  playerReference.transform.position.z);
				whipPartInitialVelocity = new Vector3(whipPartXSpeed, 0, 0);
			}
		}
		
		//instantiates sphere
		//whip[i] = GameObject.CreatePrimitive(PrimitiveType.Sphere);
		whip[i] = WhipPart(whipPartInitialVelocity);
		
		//attaches whip point to the whip in world space
		whip[i].object.transform.parent = transform;
		whip[i].object.transform.localPosition=Vector3.zero;
		whip[i].object.transform.localRotation=Quaternion.identity;
		
		//for collision ignoring
		whip[i].object.layer = 9;
		
		//names the sphere
		whip[i].object.name = "WhipPart";
						  					
		//sets the position of the sphere
		whip[i].object.transform.position = whipPartNewPosition;
		Physics.IgnoreCollision(whip[i].object.collider, playerReference.collider);
		i++;
	}
	playerReference.transform.rotation = playerRotation;
}

function destroyWhip() {
	var i : int = 0;
	while(i < whipLength) {
		Destroy(whip[i].object);
		whip[i] = null;	
		i++;
	}
}

function fixWhipPartConstraints() {
	var i : int = 0;	
	while(i < whip.Length) {
		if(whip[i] != null) {
			if(i > 0) {
				var distanceVector : Vector3 = whip[i-1].object.transform.position - whip[i].object.transform.position;
				var distanceScalar : float = distanceVector.magnitude;
				var unitVector : Vector3 = Vector3.zero;
				if(distanceScalar != 0) {
					unitVector = distanceVector/distanceScalar;
				}
				
				whip[i].object.transform.position = whip[i-1].object.transform.position - (unitVector * distanceBetweenWhipParts);
			}
		}
		i++;
	}
}

function manageWhipHeldTimer() {
	whipHeldTimer++;
	//checks to see if increment should be performed
	if(whipHeldTimer > whipHeldTimerMax) {
		//checks to see if velocity should be zeroed out and gravity should now be turned on
		var i :int = 1;
		while(i < whipLength) {
			if(whip[i] != null) {
				whip[i].velocity = new Vector3(0, whipFallSpeed, 0);
			}
			i++;
		}
	}
}

//class/object declarations below
class WhipPart {
	//this is the actual game object that this WhipPart represents
	var object : GameObject;
	var velocity : Vector3;
	var mass : int = 5;
	
	function WhipPart() {
		object = GameObject.CreatePrimitive(PrimitiveType.Sphere);
		
		velocity = new Vector3(1, -1, 0);
	}
	
	function WhipPart(initialVelocity : Vector3) {
		object = GameObject.CreatePrimitive(PrimitiveType.Sphere);
		
		velocity = initialVelocity;
	}
}