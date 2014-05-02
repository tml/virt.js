define( [

    'virtjs'

], function ( Virtjs ) {

    return Virtjs.ClassUtil.extend( {

        initialize : function ( engine ) {

            this._engine = engine;

        },

        setup : function ( ) {

            // Nothing happens here. Eh.

        },

        step : function ( cycles ) {

            this._engine.environment.gpuClock += cycles;
            this._engine.environment.gpuFrameClock += cycles;

            switch ( this._engine.environment.gpuMode ) {

                case 0x00 : this._hblank( ); break ;
                case 0x01 : this._vblank( ); break ;
                case 0x02 : this._oam( );    break ;
                case 0x03 : this._vram( );   break ;

            }

        },

        reclock : function ( cycles ) {

            this._engine.environment.gpuFrameClock += cycles;

            this._engine.environment.gpuLine = Math.floor( this._engine.environment.gpuFrameClock / 114 );

            if ( this._engine.environment.gpuFrameClock >= 144 * 114 ) {

                this._setMode( 0x01 );
                this._engine.environment.gpuClock = this._engine.environment.gpuFrameClock - 144 * 114;

            } else {

                var x = this._engine.environment.gpuFrameClock % 114;

                /****/ if ( ( x -= 20 ) < 0 ) {
                    this._setMode( 0x02 );
                    this._engine.environment.gpuClock = 20 + x;
                } else if ( ( x -= 43 ) < 0 ) {
                    this._setMode( 0x03 );
                    this._engine.environment.gpuClock = 43 + x;
                } else if ( ( x -= 51 ) < 0 ) {
                    this._setMode( 0x00 );
                    this._engine.environment.gpuClock = 51 + x;
                }

            }

        },

        _setMode : function ( mode ) {

            this._engine.environment.gpuMode = mode;

            /****/ if ( mode === 0x00 ) {
                this._engine.gpu._hblank( this._engine.environment.gpuLine );
            } else if ( mode === 0x01 ) {
                this._engine.gpu._vblank( );
            }

            // The 0x03 (VRAM) mode doesn't trigger interrupts
            if ( mode !== 0x03 && this._engine.environment.gpuInterrupts & ( 1 << ( 3 + mode ) ) ) {
                this._engine.environment.pendingInterrupts |= 0x02;
            }

        },

        _hblank : function ( ) {

            if ( this._engine.environment.gpuClock < 51 )
                return ;

            this._engine.environment.gpuClock = 0;
            this._engine.environment.gpuLine += 1;

            this._engine.environment.gpuCoincidence =
                this._engine.environment.gpuLine === this._engine.environment.gpuLyCompare;

            if ( this._engine.environment.gpuCoincidence )
                if ( this._engine.environment.gpuInterrupts & ( 1 << 6 ) )
                    this._engine.environment.pendingInterrupts |= 0x02;

            if ( this._engine.environment.gpuLine < 144 ) {
                this._setMode( 0x02 );
            } else {
                this._setMode( 0x01 );
            }

        },

        _vblank : function ( ) {

            if ( this._engine.environment.gpuClock < 114 )
                return ;

            this._engine.environment.gpuClock = 0;
            this._engine.environment.gpuLine += 1;

            if ( this._engine.environment.gpuLine === 154 )
                this._engine.environment.gpuLine = 0;

            this._engine.environment.gpuCoincidence =
                this._engine.environment.gpuLine === this._engine.environment.gpuLyCompare;

            if ( this._engine.environment.gpuCoincidence )
                if ( this._engine.environment.gpuInterrupts & ( 1 << 6 ) )
                    this._engine.environment.pendingInterrupts |= 0x02;

            if ( this._engine.environment.gpuLine !== 0 )
                return ;

            this._engine.environment.gpuFrameClock = 0;

            this._setMode( 0x02 );

        },

        _oam : function ( ) {

            if ( this._engine.environment.gpuClock < 20 )
                return ;

            this._engine.environment.gpuClock = 0;

            this._setMode( 0x03 );

        },

        _vram : function ( ) {

            if ( this._engine.environment.gpuClock < 43 )
                return ;

            this._engine.environment.gpuClock = 0;

            this._setMode( 0x00 );

        }

    } );

} );