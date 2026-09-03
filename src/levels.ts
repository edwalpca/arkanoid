function solidRow( color: BlockColor ): ( BlockColor | null )[] {
  return new Array( BLOCK_COLS ).fill( color );
}

const LEVEL_1: LevelLayout = [
  solidRow( 'red' ),
  solidRow( 'yellow' ),
  solidRow( 'green' ),
  solidRow( 'cyan' ),
  solidRow( 'magenta' ),
];

const LEVEL_2: LevelLayout = [
  [ 'gray', null, 'gray', null, 'gray', null, 'gray', null, 'gray', null, 'gray', null ],
  [ null, 'hotpink', null, 'hotpink', null, 'hotpink', null, 'hotpink', null, 'hotpink', null, 'hotpink' ],
  solidRow( 'cyan' ),
  [ null, 'magenta', null, 'magenta', null, 'magenta', null, 'magenta', null, 'magenta', null, 'magenta' ],
  solidRow( 'yellow' ),
  [ 'red', null, 'red', null, 'red', null, 'red', null, 'red', null, 'red', null ],
];

const LEVEL_3: LevelLayout = [
  solidRow( 'gray' ),
  solidRow( 'red' ),
  solidRow( 'hotpink' ),
  solidRow( 'magenta' ),
  solidRow( 'cyan' ),
  solidRow( 'green' ),
  solidRow( 'yellow' ),
];

const LEVELS: LevelLayout[] = [ LEVEL_1, LEVEL_2, LEVEL_3 ];
