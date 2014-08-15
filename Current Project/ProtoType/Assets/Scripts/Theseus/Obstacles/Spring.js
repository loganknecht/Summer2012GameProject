#pragma strict
var xVelocity : float = 0;
var yVelocity : float = 0;

var checkTop : boolean = true;
var checkBottom : boolean = true;
var checkLeft : boolean = true;
var checkRight : boolean = true;

var selfReference : GameObject;
var animatedImage : AnimatedImage;

function Start () {
	animatedImage = selfReference.GetComponent(AnimatedImage);
}

function Update () {
	checkForCollision();
}

function checkForCollision() {
	/*
	This shoots rays from corners in left/right/top/down directions in order to detect a player and or object that
	should interact, upon detecting an object it checks if it's in bounds and if not it just ignores it.
	If it is in bounds it checks the type of the object, and if it's a player it reacts accordingly
	*/
	
	// corner rays
	var topLeftRay : RaycastHit;
	var topRightRay : RaycastHit;
	var centerRay : RaycastHit;
	var bottomLeftRay : RaycastHit;
	var bottomRightRay : RaycastHit;
	
	// vectors used to represent raycast shoot points
	var topCenterPosition : Vector3;
	var bottomCenterPosition : Vector3;
	
	var leftCenterPosition : Vector3;
	var rightCenterPosition : Vector3;
	
	//for handling player collisions
	var playerObjectReference : GameObject;
	var playerControlsReference : PlayerControls;	
	
	//sets ray cast firing positions for the top and bottom location
	topCenterPosition = new Vector3(transform.position.x, transform.position.y + renderer.bounds.size.y/2, transform.position.z);
	bottomCenterPosition = new Vector3(transform.position.x, transform.position.y - renderer.bounds.size.y/2, transform.position.z);
	
	leftCenterPosition = new Vector3(transform.position.x - renderer.bounds.size.x/2, transform.position.y, transform.position.z);
	rightCenterPosition = new Vector3(transform.position.x + renderer.bounds.size.x/2, transform.position.y, transform.position.z);
	
	//left side check
	if(checkLeft) {
		//top left side of object checked
		if (Physics.Raycast(topCenterPosition, -Vector3.right, topLeftRay)) {
			//checks for collision in the object
			if(topLeftRay.distance < Mathf.Abs(renderer.bounds.size.x/2)) {
				if(topLeftRay.collider.gameObject.name.ToLower() == "player") {
					playerObjectReference = topLeftRay.collider.gameObject;
					playerControlsReference = playerObjectReference.GetComponent(PlayerControls);	
					
					playerControlsReference.movementModifier.x = xVelocity;
					playerControlsReference.movementModifier.y = yVelocity;
					playerControlsReference.isJumping = false;
					playerControlsReference.jumpUsed = true;
					playerControlsReference.animatedImage.animateOnceAndStopAtEnd(37, 37, 39);
					
					animatedImage.animateOnceAndStopAtEnd(0, 0, 5);
				}
			}
		}
		//left middle side of object checked
		if (Physics.Raycast(transform.position, -Vector3.right, centerRay)) {
			//checks for collision in the object
			if(centerRay.distance < Mathf.Abs(renderer.bounds.size.x/2)) {
				if(centerRay.collider.gameObject.name.ToLower() == "player") {
					playerObjectReference = centerRay.collider.gameObject;
					playerControlsReference = playerObjectReference.GetComponent(PlayerControls);	
					
					playerControlsReference.movementModifier.x = xVelocity;
					playerControlsReference.movementModifier.y = yVelocity;
					playerControlsReference.isJumping = false;
					playerControlsReference.jumpUsed = true;
					playerControlsReference.animatedImage.animateOnceAndStopAtEnd(37, 37, 39);
					
					animatedImage.animateOnceAndStopAtEnd(0, 0, 5);
				}
			}
		}
		//bottom left side of object checked
		if (Physics.Raycast(bottomCenterPosition, -Vector3.right, bottomLeftRay)) {
			//checks for collision in the object
			if(bottomLeftRay.distance < Mathf.Abs(renderer.bounds.size.x/2)) {
				if(bottomLeftRay.collider.gameObject.name.ToLower() == "player") {
					playerObjectReference = bottomLeftRay.collider.gameObject;
					playerControlsReference = playerObjectReference.GetComponent(PlayerControls);	
					
					playerControlsReference.movementModifier.x = xVelocity;
					playerControlsReference.movementModifier.y = yVelocity;
					playerControlsReference.isJumping = false;
					playerControlsReference.jumpUsed = true;
					playerControlsReference.animatedImage.animateOnceAndStopAtEnd(37, 37, 39);
					
					animatedImage.animateOnceAndStopAtEnd(0, 0, 5);
				}
			}
		}
	}

	//right side check
	if(checkRight) {
		//top right side of object checked
		if (Physics.Raycast(topCenterPosition, Vector3.right, topRightRay)) {
			//checks for collision in the object
			if(topRightRay.distance < Mathf.Abs(renderer.bounds.size.x/2)) {
				if(topRightRay.collider.gameObject.name.ToLower() == "player") {
					playerObjectReference = topRightRay.collider.gameObject;
					playerControlsReference = playerObjectReference.GetComponent(PlayerControls);	
					
					playerControlsReference.movementModifier.x = xVelocity;
					playerControlsReference.movementModifier.y = yVelocity;
					playerControlsReference.isJumping = false;
					playerControlsReference.jumpUsed = true;
					playerControlsReference.animatedImage.animateOnceAndStopAtEnd(37, 37, 39);
					
					animatedImage.animateOnceAndStopAtEnd(0, 0, 5);
				}
			}
		}
		//right middle side of object checked
		if (Physics.Raycast(transform.position, Vector3.right, centerRay)) {
			//checks for collision in the object
			if(centerRay.distance < Mathf.Abs(renderer.bounds.size.x/2)) {
				if(centerRay.collider.gameObject.name.ToLower() == "player") {
					playerObjectReference = centerRay.collider.gameObject;
					playerControlsReference = playerObjectReference.GetComponent(PlayerControls);	
					
					playerControlsReference.movementModifier.x = xVelocity;
					playerControlsReference.movementModifier.y = yVelocity;
					playerControlsReference.isJumping = false;
					playerControlsReference.jumpUsed = true;
					playerControlsReference.animatedImage.animateOnceAndStopAtEnd(37, 37, 39);
					
					animatedImage.animateOnceAndStopAtEnd(0, 0, 5);
				}
			}
		}
		//bottom right side of object checked
		if (Physics.Raycast(bottomCenterPosition, Vector3.right, bottomRightRay)) {
			//checks for collision in the object
			if(bottomRightRay.distance < Mathf.Abs(renderer.bounds.size.x/2)) {
				if(bottomRightRay.collider.gameObject.name.ToLower() == "player") {
					playerObjectReference = bottomRightRay.collider.gameObject;
					playerControlsReference = playerObjectReference.GetComponent(PlayerControls);	
					
					playerControlsReference.movementModifier.x = xVelocity;
					playerControlsReference.movementModifier.y = yVelocity;
					playerControlsReference.isJumping = false;
					playerControlsReference.jumpUsed = true;
					playerControlsReference.animatedImage.animateOnceAndStopAtEnd(37, 37, 39);
					
					animatedImage.animateOnceAndStopAtEnd(0, 0, 5);
				}
			}
		}
	}
	//top side check
	if(checkTop) {
		//top left side of object checked
		if (Physics.Raycast(leftCenterPosition, Vector3.up, topLeftRay)) {
			//checks for collision in the object
			if(topLeftRay.distance < Mathf.Abs(renderer.bounds.size.y/2)) {
				if(topLeftRay.collider.gameObject.name.ToLower() == "player") {
					playerObjectReference = topLeftRay.collider.gameObject;
					playerControlsReference = playerObjectReference.GetComponent(PlayerControls);
					
					playerControlsReference.movementModifier.x = xVelocity;
					playerControlsReference.movementModifier.y = yVelocity;
					playerControlsReference.isJumping = false;
					playerControlsReference.jumpUsed = true;
					playerControlsReference.animatedImage.animateOnceAndStopAtEnd(37, 37, 39);
					
					animatedImage.animateOnceAndStopAtEnd(0, 0, 5);
				}
			}
		}
		//top middle side of object checked
		if (Physics.Raycast(transform.position, Vector3.up, centerRay)) {
			//checks for collision in the object
			if(centerRay.distance < Mathf.Abs(renderer.bounds.size.y/2)) {
				if(centerRay.collider.gameObject.name.ToLower() == "player") {
					playerObjectReference = centerRay.collider.gameObject;
					playerControlsReference = playerObjectReference.GetComponent(PlayerControls);	
					
					playerControlsReference.movementModifier.x = xVelocity;
					playerControlsReference.movementModifier.y = yVelocity;
					playerControlsReference.isJumping = false;
					playerControlsReference.jumpUsed = true;
					playerControlsReference.animatedImage.animateOnceAndStopAtEnd(37, 37, 39);
					
					animatedImage.animateOnceAndStopAtEnd(0, 0, 5);
				}
			}
		}
		//top right side of object checked
		if (Physics.Raycast(rightCenterPosition, Vector3.up, topRightRay)) {
			//checks for collision in the object
			if(topRightRay.distance < Mathf.Abs(renderer.bounds.size.y/2)) {
				if(topRightRay.collider.gameObject.name.ToLower() == "player") {
					playerObjectReference = topRightRay.collider.gameObject;
					playerControlsReference = playerObjectReference.GetComponent(PlayerControls);
					
					playerControlsReference.movementModifier.x = xVelocity;
					playerControlsReference.movementModifier.y = yVelocity;
					playerControlsReference.isJumping = false;
					playerControlsReference.jumpUsed = true;
					playerControlsReference.animatedImage.animateOnceAndStopAtEnd(37, 37, 39);
					
					animatedImage.animateOnceAndStopAtEnd(0, 0, 5);
				}
			}
		}
	}
	//bottom side check
	if(checkBottom) {
		//bottom left side of object checked
		if (Physics.Raycast(leftCenterPosition, -Vector3.up, bottomLeftRay)) {
			//checks for collision in the object
			if(bottomLeftRay.distance < Mathf.Abs(renderer.bounds.size.y/2)) {
				if(bottomLeftRay.collider.gameObject.name.ToLower() == "player") {
					playerObjectReference = bottomLeftRay.collider.gameObject;
					playerControlsReference = playerObjectReference.GetComponent(PlayerControls);
					
					playerControlsReference.movementModifier.x = xVelocity;
					playerControlsReference.movementModifier.y = yVelocity;
					playerControlsReference.isJumping = false;
					playerControlsReference.jumpUsed = true;
					playerControlsReference.animatedImage.animateOnceAndStopAtEnd(37, 37, 39);
					
					animatedImage.animateOnceAndStopAtEnd(0, 0, 5);
				}
			}
		}
		//bottom middle side of object checked
		if (Physics.Raycast(transform.position, -Vector3.up, centerRay)) {
			//checks for collision in the object
			if(centerRay.distance < Mathf.Abs(renderer.bounds.size.y/2)) {
				if(centerRay.collider.gameObject.name.ToLower() == "player") {
					playerObjectReference = centerRay.collider.gameObject;
					playerControlsReference = playerObjectReference.GetComponent(PlayerControls);	
					
					playerControlsReference.movementModifier.x = xVelocity;
					playerControlsReference.movementModifier.y = yVelocity;
					playerControlsReference.isJumping = false;
					playerControlsReference.jumpUsed = true;
					playerControlsReference.animatedImage.animateOnceAndStopAtEnd(37, 37, 39);
					
					animatedImage.animateOnceAndStopAtEnd(0, 0, 5);
				}
			}
		}
		//bottom right side of object checked
		if (Physics.Raycast(rightCenterPosition, -Vector3.up, bottomRightRay)) {
			//checks for collision in the object
			if(bottomRightRay.distance < Mathf.Abs(renderer.bounds.size.y/2)) {
				if(bottomRightRay.collider.gameObject.name.ToLower() == "player") {
					playerObjectReference = bottomRightRay.collider.gameObject;
					playerControlsReference = playerObjectReference.GetComponent(PlayerControls);
					
					playerControlsReference.movementModifier.x = xVelocity;
					playerControlsReference.movementModifier.y = yVelocity;
					playerControlsReference.isJumping = false;
					playerControlsReference.jumpUsed = true;
					playerControlsReference.animatedImage.animateOnceAndStopAtEnd(37, 37, 39);
					
					animatedImage.animateOnceAndStopAtEnd(0, 0, 5);
				}
			}
		}
	}
}