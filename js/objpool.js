// Pool Class for Tanks.js Game
// PoolClass' inspred by: http://blog.sklambert.com/javascript-object-pool/

// Bullets
function BulletPool(numBullets)
{
    var size = (numBullets != undefined) ? numBullets : 50;
    var pool = [];
    
    this.init = function(){
        for(var i = 0; i < size; i++){
            var obj = new Bullet(); // Pre-creating bullets and their shape!
            obj.init(); // Setup defaults for the bullets (this will also precreate their shapes)
            pool[i] = obj; // Add it to the pool
        }
    };
            
    // In order to make use of a pool object, you must get one. But to properly do that, this method must mock what you want the object to do when it "spawns"
    // This method simply passes the parameters back to the primary class' spawn method. The spawn method will work with them.
    // When a unit wants to fire a bullet, they need to "Get" one.
    this.get = function(x,y,dx,dy,time,team,damage,shooter,type,target,airAttack)
    {
    	if(pool[size - 1].inUse)
            IncreasePoolSize(); // If, in the event the pool is all used up, increase the supply to meet demand

    	// If the last value of the pool is in use, then the pool is full. We should do something here to increase the pool to accomodate demand.
        if(!pool[size - 1].inUse) {
            pool[size - 1].spawn(x,y,dx,dy,time,team,damage,shooter,type,target,airAttack);
            pool.unshift(pool.pop());
        }

    };
    
    // This method will allow that unit to "Use" the bullet (otherwise known as Move() and Draw() from the primary class)
    this.use = function(){
        for(var i = 0; i < size; i++)
            if(pool[i].inUse){
                if(pool[i].use()){
                    pool[i].clear();
                    pool.push((pool.splice(i,1))[0]);
                }
            }
            else
                break;
    }

    // Private
    // Increases pool size by five
	function IncreasePoolSize()
	{
		for(var i = 0; i < 5; i++){
			var obj = new Bullet();
			obj.init();
			pool.push(obj);
		}
		size+=5; // Increases the local size count so that the new items can be used...
	}
}

function SmokePool(numSmokes)
{
    var size = (numSmokes!= undefined) ? numSmokes : 50;
    var pool = [];
    
    this.init = function(){
        for(var i = 0; i < size; i++){
            var obj = new Smoke(); // Pre-creating bullets!
            obj.init();
            pool[i] = obj;
        }
    };
            
    this.get = function(x, y, startSize, endSize, time, redness)
    {
        if(pool[size - 1].inUse)
            IncreasePoolSize();
            
        if(!pool[size - 1].inUse) {
            pool[size - 1].spawn(x, y, startSize, endSize, time, redness);
            pool.unshift(pool.pop());
        }
    };
    
    this.use = function(){
        for(var i = 0; i < size; i++)
            if(pool[i].inUse){
                if(pool[i].use()){
                    pool[i].clear();
                    pool.push((pool.splice(i,1))[0]);
                }
            }
            else
                break;
    };
    
    // Increases pool size by five
    function IncreasePoolSize()
    {
         for(var i = 0; i < 5; i++){
            var obj = new Smoke();
            obj.init();
            pool.push(obj);
        }
        size+=5;    
    }
}

function ExplosionPool(numBooms)
{
    var size = (numBooms != undefined) ? numBooms : 50;
    var pool = [];
    
    this.init = function(){
        for(var i = 0; i < size; i++){
            var obj = new Explosion(); // Pre-creating bullets!
            obj.init();
            pool[i] = obj;
        }
    };
            
    this.get = function(x, y, preDisplayTime, eSize)
    {
        if(pool[size - 1].inUse)
            IncreasePoolSize();
            
        if(!pool[size - 1].inUse) {
            pool[size - 1].spawn(x, y, preDisplayTime, eSize);
            pool.unshift(pool.pop());
        }
    };
    
    this.use = function(){
        for(var i = 0; i < size; i++)
            if(pool[i].inUse){
                if(pool[i].use()){
                    pool[i].clear();
                    pool.push((pool.splice(i,1))[0]);
                }
            }
            else
                break;
    };
    
    // Increases pool size by five
    function IncreasePoolSize()
    {
         for(var i = 0; i < 5; i++){
            var obj = new Explosion();
            obj.init();
            pool.push(obj);
        }
        size+=5;
        //resized++;
    }
}

function DebrisPool(numDebris)
{
    var size = (numDebris!= undefined) ? numDebris : 50;
    var pool = [];
    
    this.init = function(){
        for(var i = 0; i < size; i++){
            var obj = new Debris();
            obj.init();
            pool[i] = obj;
        }
    };
            
    this.get = function(x, y, dx, dy, time, redness)
    {
        if(pool[size - 1].inUse)
            IncreasePoolSize();
            
        if(!pool[size - 1].inUse) {
            pool[size - 1].spawn(x, y, dx, dy, time, redness);
            pool.unshift(pool.pop());
        }
    };
    
    this.use = function(){
        for(var i = 0; i < size; i++)
            if(pool[i].inUse){
                if(pool[i].use()){
                    pool[i].clear();
                    pool.push((pool.splice(i,1))[0]);
                }
            }
            else
                break;
    };
    
    // Increases pool size by five
    function IncreasePoolSize()
    {
         for(var i = 0; i < 5; i++){
            var obj = new Debris();
            obj.init();
            pool.push(obj);
        }
        size+=5;    
    }
}