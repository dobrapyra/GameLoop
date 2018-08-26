/*!
 * GameLoop
 * version: 2018.08.26
 * author: dobrapyra
 * url: https://github.com/dobrapyra/GameLoop
 */
(function(root, factory) {
  if (typeof define === 'function' && define.amd) { // AMD
    define([], factory);
  } else if (typeof exports === 'object') { // Node, CommonJS-like
    module.exports = factory();
  } else { // Browser globals (root is window)
    root.Loop = factory();
  }
}(this, function() {

  var Loop = function(cfg){ this.init(cfg); };
  Object.assign(Loop.prototype, {

    init: function(cfg) {
      // const noop
      var noop = function(){};

      // #region config
      this.onUpdate = cfg.handleUpdate || noop;
      this.onRender = cfg.handleRender || noop;
      this.onPanic = cfg.handlePanic || noop;
      this.onRawFrame = cfg.handleRawFrame || null;
      this.timestep = cfg.timestep || ( 1000 / 60 );
      this.minFrameTime = 1000 / ( cfg.fpsLimit || 66 );
      this.fpsMeter = cfg.fpsMeter || true;
      // #endregion config

      // #region vars
      this.started = false;
      this.running = false;
      this.rafId = null;
      this.lastFrameTime = 0;
      this.lastFpsUpdate = 0;
      this.framesThisSecond = 0;
      this.delta = 0;
      this.fps = this.fpsMeter ? 0 : null;
      // #endregion vars

      // #region bind this
      this.start = this.start.bind(this);
      this.stop = this.stop.bind(this);
      this.initLoop = this.initLoop.bind(this);
      this.loop = this.loop.bind(this);
      // #endregion bind this
    },

    update: function(delta) {
      this.onUpdate(delta);
    },

    render: function(interp) {
      this.onRender(interp, this.fps);
    },

    start: function() {
      if( !this.started ) {
        this.started = true;

        // first frame for get timestamp and initial render
        this.rafId = requestAnimationFrame( this.initLoop );
      }
    },

    stop: function() {
      this.running = false;
      this.started = false;
      cancelAnimationFrame( this.rafId );
    },

    initLoop: function(timestamp) {
      this.render(1); // initial render
      this.running = true;

      // #region reset some vars
      this.lastFrameTime = timestamp;
      this.lastFpsUpdate = timestamp;
      this.framesThisSecond = 0;
      // #endregion reset some vars

      // first standard frame
      this.rafId = requestAnimationFrame( this.loop );
    },

    loop: function(timestamp) {
      // #region raw frame mode
      if( this.onRawFrame !== null ) {
        this.onRawFrame(timestamp);
        this.rafId = requestAnimationFrame( this.loop );
        return;
      }
      // #endregion raw frame mode

      // #region fps throttle
      if( timestamp < this.lastFrameTime + this.minFrameTime ) {
        this.rafId = requestAnimationFrame( this.loop );
        return;
      }
      // #endregion fps throttle

      this.delta += timestamp - this.lastFrameTime;
      this.lastFrameTime = timestamp;

      // #region fps meter
      if( this.fpsMeter ) {
        if( timestamp > this.lastFpsUpdate + 1000 ) { // update every second
          // this.fps = 0.4 * this.framesThisSecond + 0.6 * this.fps; // compute the new fps
          this.fps = this.framesThisSecond;

          this.lastFpsUpdate = timestamp;
          this.framesThisSecond = 0;
        }
        this.framesThisSecond++;
      }
      // #endregion fps meter

      // #region panic handler loop
      var updateSteps = 0;
      while( this.delta >= this.timestep ) {
        this.update( this.timestep );
        this.delta -= this.timestep;

        if( ++updateSteps >= 240 ) {
          this.panic();
          break;
        }
      }
      // #endregion panic handler loop

      this.render( this.delta / this.timestep );

      // next standard frame
      this.rafId = requestAnimationFrame( this.loop );
    },

    panic: function() {
      console.warn('panic');
      this.delta = 0;
      this.onPanic();
    }

  });

  return Loop;
}));