<?php declare(strict_types = 1);

// osfsl-/Users/work/Documents/my-projects/hermitbets/hermitbets/vendor/composer/../inertiajs/inertia-laravel/src/PreservesBigIntegers.php-PHPStan\BetterReflection\Reflection\ReflectionClass-Inertia\PreservesBigIntegers
return \PHPStan\Cache\CacheItem::__set_state(array(
   'variableKey' => 'v2-dcd4c183b58bdb73765c08cc544bae456a6fbe5426b0a7404e28d347b4eb101f-8.4.19-6.73.0.5',
   'data' => 
  array (
    'locatedSource' => 
    array (
      'class' => 'PHPStan\\BetterReflection\\SourceLocator\\Located\\LocatedSource',
      'data' => 
      array (
        'name' => 'Inertia\\PreservesBigIntegers',
        'filename' => '/Users/work/Documents/my-projects/hermitbets/hermitbets/vendor/composer/../inertiajs/inertia-laravel/src/PreservesBigIntegers.php',
      ),
    ),
    'namespace' => 'Inertia',
    'name' => 'Inertia\\PreservesBigIntegers',
    'shortName' => 'PreservesBigIntegers',
    'isInterface' => false,
    'isTrait' => true,
    'isEnum' => false,
    'isBackedEnum' => false,
    'modifiers' => 0,
    'docComment' => NULL,
    'attributes' => 
    array (
    ),
    'startLine' => 12,
    'endLine' => 146,
    'startColumn' => 1,
    'endColumn' => 1,
    'parentClassName' => NULL,
    'implementsClassNames' => 
    array (
    ),
    'traitClassNames' => 
    array (
    ),
    'immediateConstants' => 
    array (
      'BIG_INTEGER_KEY' => 
      array (
        'declaringClassName' => 'Inertia\\PreservesBigIntegers',
        'implementingClassName' => 'Inertia\\PreservesBigIntegers',
        'name' => 'BIG_INTEGER_KEY',
        'modifiers' => 2,
        'type' => NULL,
        'value' => 
        array (
          'code' => '\'$bigint\'',
          'attributes' => 
          array (
            'startLine' => 19,
            'endLine' => 19,
            'startTokenPos' => 53,
            'startFilePos' => 395,
            'endTokenPos' => 53,
            'endFilePos' => 403,
          ),
        ),
        'docComment' => '/**
 * The key a big integer is transported under.
 *
 * @link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt#use_within_json
 */',
        'attributes' => 
        array (
        ),
        'startLine' => 19,
        'endLine' => 19,
        'startColumn' => 5,
        'endColumn' => 48,
      ),
      'MAX_SAFE_INTEGER' => 
      array (
        'declaringClassName' => 'Inertia\\PreservesBigIntegers',
        'implementingClassName' => 'Inertia\\PreservesBigIntegers',
        'name' => 'MAX_SAFE_INTEGER',
        'modifiers' => 2,
        'type' => NULL,
        'value' => 
        array (
          'code' => '9007199254740991',
          'attributes' => 
          array (
            'startLine' => 24,
            'endLine' => 24,
            'startTokenPos' => 66,
            'startFilePos' => 537,
            'endTokenPos' => 66,
            'endFilePos' => 552,
          ),
        ),
        'docComment' => '/**
 * The largest integer JavaScript represents without losing precision.
 */',
        'attributes' => 
        array (
        ),
        'startLine' => 24,
        'endLine' => 24,
        'startColumn' => 5,
        'endColumn' => 56,
      ),
    ),
    'immediateProperties' => 
    array (
      'preserveBigIntegers' => 
      array (
        'declaringClassName' => 'Inertia\\PreservesBigIntegers',
        'implementingClassName' => 'Inertia\\PreservesBigIntegers',
        'name' => 'preserveBigIntegers',
        'modifiers' => 2,
        'type' => 
        array (
          'class' => 'PHPStan\\BetterReflection\\Reflection\\ReflectionNamedType',
          'data' => 
          array (
            'name' => 'bool',
            'isIdentifier' => true,
          ),
        ),
        'default' => 
        array (
          'code' => 'false',
          'attributes' => 
          array (
            'startLine' => 29,
            'endLine' => 29,
            'startTokenPos' => 79,
            'startFilePos' => 696,
            'endTokenPos' => 79,
            'endFilePos' => 700,
          ),
        ),
        'docComment' => '/**
 * Indicates if integers outside JavaScript\'s safe range should be preserved.
 */',
        'attributes' => 
        array (
        ),
        'startLine' => 29,
        'endLine' => 29,
        'startColumn' => 5,
        'endColumn' => 48,
        'isPromoted' => false,
        'declaredAtCompileTime' => true,
        'immediateVirtual' => false,
        'immediateHooks' => 
        array (
        ),
      ),
    ),
    'immediateMethods' => 
    array (
      'encodeBigIntegersWhenEnabled' => 
      array (
        'name' => 'encodeBigIntegersWhenEnabled',
        'parameters' => 
        array (
          'value' => 
          array (
            'name' => 'value',
            'default' => NULL,
            'type' => 
            array (
              'class' => 'PHPStan\\BetterReflection\\Reflection\\ReflectionNamedType',
              'data' => 
              array (
                'name' => 'mixed',
                'isIdentifier' => true,
              ),
            ),
            'isVariadic' => false,
            'byRef' => false,
            'isPromoted' => false,
            'attributes' => 
            array (
            ),
            'startLine' => 34,
            'endLine' => 34,
            'startColumn' => 53,
            'endColumn' => 64,
            'parameterIndex' => 0,
            'isOptional' => false,
          ),
        ),
        'returnsReference' => false,
        'returnType' => 
        array (
          'class' => 'PHPStan\\BetterReflection\\Reflection\\ReflectionNamedType',
          'data' => 
          array (
            'name' => 'mixed',
            'isIdentifier' => true,
          ),
        ),
        'attributes' => 
        array (
        ),
        'docComment' => '/**
 * Wrap big integers only when this response opted in.
 */',
        'startLine' => 34,
        'endLine' => 37,
        'startColumn' => 5,
        'endColumn' => 5,
        'couldThrow' => false,
        'isClosure' => false,
        'isGenerator' => false,
        'isVariadic' => false,
        'modifiers' => 2,
        'namespace' => 'Inertia',
        'declaringClassName' => 'Inertia\\PreservesBigIntegers',
        'implementingClassName' => 'Inertia\\PreservesBigIntegers',
        'currentClassName' => 'Inertia\\PreservesBigIntegers',
        'aliasName' => NULL,
      ),
      'encodeBigIntegers' => 
      array (
        'name' => 'encodeBigIntegers',
        'parameters' => 
        array (
          'value' => 
          array (
            'name' => 'value',
            'default' => NULL,
            'type' => 
            array (
              'class' => 'PHPStan\\BetterReflection\\Reflection\\ReflectionNamedType',
              'data' => 
              array (
                'name' => 'mixed',
                'isIdentifier' => true,
              ),
            ),
            'isVariadic' => false,
            'byRef' => false,
            'isPromoted' => false,
            'attributes' => 
            array (
            ),
            'startLine' => 46,
            'endLine' => 46,
            'startColumn' => 42,
            'endColumn' => 53,
            'parameterIndex' => 0,
            'isOptional' => false,
          ),
          'seen' => 
          array (
            'name' => 'seen',
            'default' => 
            array (
              'code' => 'null',
              'attributes' => 
              array (
                'startLine' => 46,
                'endLine' => 46,
                'startTokenPos' => 142,
                'startFilePos' => 1317,
                'endTokenPos' => 142,
                'endFilePos' => 1320,
              ),
            ),
            'type' => 
            array (
              'class' => 'PHPStan\\BetterReflection\\Reflection\\ReflectionUnionType',
              'data' => 
              array (
                'types' => 
                array (
                  0 => 
                  array (
                    'class' => 'PHPStan\\BetterReflection\\Reflection\\ReflectionNamedType',
                    'data' => 
                    array (
                      'name' => 'SplObjectStorage',
                      'isIdentifier' => false,
                    ),
                  ),
                  1 => 
                  array (
                    'class' => 'PHPStan\\BetterReflection\\Reflection\\ReflectionNamedType',
                    'data' => 
                    array (
                      'name' => 'null',
                      'isIdentifier' => true,
                    ),
                  ),
                ),
              ),
            ),
            'isVariadic' => false,
            'byRef' => false,
            'isPromoted' => false,
            'attributes' => 
            array (
            ),
            'startLine' => 46,
            'endLine' => 46,
            'startColumn' => 56,
            'endColumn' => 85,
            'parameterIndex' => 1,
            'isOptional' => true,
          ),
        ),
        'returnsReference' => false,
        'returnType' => 
        array (
          'class' => 'PHPStan\\BetterReflection\\Reflection\\ReflectionNamedType',
          'data' => 
          array (
            'name' => 'mixed',
            'isIdentifier' => true,
          ),
        ),
        'attributes' => 
        array (
        ),
        'docComment' => '/**
 * Wrap integers outside JavaScript\'s safe integer range as a marker so the
 * frontend can revive them as native BigInt values without losing
 * precision when the JSON response is parsed.
 *
 * @param  SplObjectStorage<object, mixed>|null  $seen
 */',
        'startLine' => 46,
        'endLine' => 78,
        'startColumn' => 5,
        'endColumn' => 5,
        'couldThrow' => false,
        'isClosure' => false,
        'isGenerator' => false,
        'isVariadic' => false,
        'modifiers' => 2,
        'namespace' => 'Inertia',
        'declaringClassName' => 'Inertia\\PreservesBigIntegers',
        'implementingClassName' => 'Inertia\\PreservesBigIntegers',
        'currentClassName' => 'Inertia\\PreservesBigIntegers',
        'aliasName' => NULL,
      ),
      'encodeBigIntegersInArray' => 
      array (
        'name' => 'encodeBigIntegersInArray',
        'parameters' => 
        array (
          'value' => 
          array (
            'name' => 'value',
            'default' => NULL,
            'type' => 
            array (
              'class' => 'PHPStan\\BetterReflection\\Reflection\\ReflectionNamedType',
              'data' => 
              array (
                'name' => 'array',
                'isIdentifier' => true,
              ),
            ),
            'isVariadic' => false,
            'byRef' => false,
            'isPromoted' => false,
            'attributes' => 
            array (
            ),
            'startLine' => 87,
            'endLine' => 87,
            'startColumn' => 49,
            'endColumn' => 60,
            'parameterIndex' => 0,
            'isOptional' => false,
          ),
          'seen' => 
          array (
            'name' => 'seen',
            'default' => NULL,
            'type' => 
            array (
              'class' => 'PHPStan\\BetterReflection\\Reflection\\ReflectionUnionType',
              'data' => 
              array (
                'types' => 
                array (
                  0 => 
                  array (
                    'class' => 'PHPStan\\BetterReflection\\Reflection\\ReflectionNamedType',
                    'data' => 
                    array (
                      'name' => 'SplObjectStorage',
                      'isIdentifier' => false,
                    ),
                  ),
                  1 => 
                  array (
                    'class' => 'PHPStan\\BetterReflection\\Reflection\\ReflectionNamedType',
                    'data' => 
                    array (
                      'name' => 'null',
                      'isIdentifier' => true,
                    ),
                  ),
                ),
              ),
            ),
            'isVariadic' => false,
            'byRef' => false,
            'isPromoted' => false,
            'attributes' => 
            array (
            ),
            'startLine' => 87,
            'endLine' => 87,
            'startColumn' => 63,
            'endColumn' => 85,
            'parameterIndex' => 1,
            'isOptional' => false,
          ),
        ),
        'returnsReference' => false,
        'returnType' => 
        array (
          'class' => 'PHPStan\\BetterReflection\\Reflection\\ReflectionNamedType',
          'data' => 
          array (
            'name' => 'array',
            'isIdentifier' => true,
          ),
        ),
        'attributes' => 
        array (
        ),
        'docComment' => '/**
 * Wrap the big integers held by the given array.
 *
 * @param  array<array-key, mixed>  $value
 * @param  SplObjectStorage<object, mixed>|null  $seen
 * @return array<array-key, mixed>
 */',
        'startLine' => 87,
        'endLine' => 94,
        'startColumn' => 5,
        'endColumn' => 5,
        'couldThrow' => false,
        'isClosure' => false,
        'isGenerator' => false,
        'isVariadic' => false,
        'modifiers' => 2,
        'namespace' => 'Inertia',
        'declaringClassName' => 'Inertia\\PreservesBigIntegers',
        'implementingClassName' => 'Inertia\\PreservesBigIntegers',
        'currentClassName' => 'Inertia\\PreservesBigIntegers',
        'aliasName' => NULL,
      ),
      'encodeBigIntegersInObject' => 
      array (
        'name' => 'encodeBigIntegersInObject',
        'parameters' => 
        array (
          'value' => 
          array (
            'name' => 'value',
            'default' => NULL,
            'type' => 
            array (
              'class' => 'PHPStan\\BetterReflection\\Reflection\\ReflectionNamedType',
              'data' => 
              array (
                'name' => 'object',
                'isIdentifier' => true,
              ),
            ),
            'isVariadic' => false,
            'byRef' => false,
            'isPromoted' => false,
            'attributes' => 
            array (
            ),
            'startLine' => 103,
            'endLine' => 103,
            'startColumn' => 50,
            'endColumn' => 62,
            'parameterIndex' => 0,
            'isOptional' => false,
          ),
          'seen' => 
          array (
            'name' => 'seen',
            'default' => NULL,
            'type' => 
            array (
              'class' => 'PHPStan\\BetterReflection\\Reflection\\ReflectionNamedType',
              'data' => 
              array (
                'name' => 'SplObjectStorage',
                'isIdentifier' => false,
              ),
            ),
            'isVariadic' => false,
            'byRef' => false,
            'isPromoted' => false,
            'attributes' => 
            array (
            ),
            'startLine' => 103,
            'endLine' => 103,
            'startColumn' => 65,
            'endColumn' => 86,
            'parameterIndex' => 1,
            'isOptional' => false,
          ),
        ),
        'returnsReference' => false,
        'returnType' => 
        array (
          'class' => 'PHPStan\\BetterReflection\\Reflection\\ReflectionNamedType',
          'data' => 
          array (
            'name' => 'mixed',
            'isIdentifier' => true,
          ),
        ),
        'attributes' => 
        array (
        ),
        'docComment' => '/**
 * Wrap the big integers held by the given object, unwrapping it the same
 * way json_encode would so the shape it emits is unchanged. Objects are
 * cast back so they keep serializing as a JSON object, not an array.
 *
 * @param  SplObjectStorage<object, mixed>  $seen
 */',
        'startLine' => 103,
        'endLine' => 127,
        'startColumn' => 5,
        'endColumn' => 5,
        'couldThrow' => false,
        'isClosure' => false,
        'isGenerator' => false,
        'isVariadic' => false,
        'modifiers' => 2,
        'namespace' => 'Inertia',
        'declaringClassName' => 'Inertia\\PreservesBigIntegers',
        'implementingClassName' => 'Inertia\\PreservesBigIntegers',
        'currentClassName' => 'Inertia\\PreservesBigIntegers',
        'aliasName' => NULL,
      ),
      'hasPlainJsonRepresentation' => 
      array (
        'name' => 'hasPlainJsonRepresentation',
        'parameters' => 
        array (
          'value' => 
          array (
            'name' => 'value',
            'default' => NULL,
            'type' => 
            array (
              'class' => 'PHPStan\\BetterReflection\\Reflection\\ReflectionNamedType',
              'data' => 
              array (
                'name' => 'object',
                'isIdentifier' => true,
              ),
            ),
            'isVariadic' => false,
            'byRef' => false,
            'isPromoted' => false,
            'attributes' => 
            array (
            ),
            'startLine' => 132,
            'endLine' => 132,
            'startColumn' => 51,
            'endColumn' => 63,
            'parameterIndex' => 0,
            'isOptional' => false,
          ),
        ),
        'returnsReference' => false,
        'returnType' => 
        array (
          'class' => 'PHPStan\\BetterReflection\\Reflection\\ReflectionNamedType',
          'data' => 
          array (
            'name' => 'bool',
            'isIdentifier' => true,
          ),
        ),
        'attributes' => 
        array (
        ),
        'docComment' => '/**
 * Determine if the object\'s public properties are what json_encode emits.
 */',
        'startLine' => 132,
        'endLine' => 145,
        'startColumn' => 5,
        'endColumn' => 5,
        'couldThrow' => false,
        'isClosure' => false,
        'isGenerator' => false,
        'isVariadic' => false,
        'modifiers' => 2,
        'namespace' => 'Inertia',
        'declaringClassName' => 'Inertia\\PreservesBigIntegers',
        'implementingClassName' => 'Inertia\\PreservesBigIntegers',
        'currentClassName' => 'Inertia\\PreservesBigIntegers',
        'aliasName' => NULL,
      ),
    ),
    'traitsData' => 
    array (
      'aliases' => 
      array (
      ),
      'modifiers' => 
      array (
      ),
      'precedences' => 
      array (
      ),
      'hashes' => 
      array (
      ),
    ),
  ),
));