<?php declare(strict_types = 1);

// osfsl-/Users/work/Documents/my-projects/hermitbets/hermitbets/vendor/composer/../laravel/framework/src/Illuminate/Database/Schema/ForeignKeyDefinition.php-PHPStan\BetterReflection\Reflection\ReflectionClass-Illuminate\Database\Schema\ForeignKeyDefinition
return \PHPStan\Cache\CacheItem::__set_state(array(
   'variableKey' => 'v2-642eeb3522c0f140de9d91775207b5bcfeb960062d9856a6c79e4d766c175ed0-8.4.19-6.73.0.5',
   'data' => 
  array (
    'locatedSource' => 
    array (
      'class' => 'PHPStan\\BetterReflection\\SourceLocator\\Located\\LocatedSource',
      'data' => 
      array (
        'name' => 'Illuminate\\Database\\Schema\\ForeignKeyDefinition',
        'filename' => '/Users/work/Documents/my-projects/hermitbets/hermitbets/vendor/composer/../laravel/framework/src/Illuminate/Database/Schema/ForeignKeyDefinition.php',
      ),
    ),
    'namespace' => 'Illuminate\\Database\\Schema',
    'name' => 'Illuminate\\Database\\Schema\\ForeignKeyDefinition',
    'shortName' => 'ForeignKeyDefinition',
    'isInterface' => false,
    'isTrait' => false,
    'isEnum' => false,
    'isBackedEnum' => false,
    'modifiers' => 0,
    'docComment' => '/**
 * @method ForeignKeyDefinition deferrable(bool $value = true) Set the foreign key as deferrable (PostgreSQL)
 * @method ForeignKeyDefinition initiallyImmediate(bool $value = true) Set the default time to check the constraint (PostgreSQL)
 * @method ForeignKeyDefinition inplace(bool $value = true) Specify that algorithm=inplace should be used for the foreign key operation, which requires foreign key checks to be disabled (MySQL)
 * @method ForeignKeyDefinition lock((\'none\'|\'shared\'|\'default\'|\'exclusive\') $value) Specify the DDL lock mode for the foreign key operation (MySQL)
 * @method ForeignKeyDefinition on(string $table) Specify the referenced table
 * @method ForeignKeyDefinition onDelete(string $action) Add an ON DELETE action
 * @method ForeignKeyDefinition onUpdate(string $action) Add an ON UPDATE action
 * @method ForeignKeyDefinition references(string|string[] $columns) Specify the referenced column(s)
 */',
    'attributes' => 
    array (
    ),
    'startLine' => 17,
    'endLine' => 98,
    'startColumn' => 1,
    'endColumn' => 1,
    'parentClassName' => 'Illuminate\\Support\\Fluent',
    'implementsClassNames' => 
    array (
    ),
    'traitClassNames' => 
    array (
    ),
    'immediateConstants' => 
    array (
    ),
    'immediateProperties' => 
    array (
    ),
    'immediateMethods' => 
    array (
      'cascadeOnUpdate' => 
      array (
        'name' => 'cascadeOnUpdate',
        'parameters' => 
        array (
        ),
        'returnsReference' => false,
        'returnType' => NULL,
        'attributes' => 
        array (
        ),
        'docComment' => '/**
 * Indicate that updates should cascade.
 *
 * @return $this
 */',
        'startLine' => 24,
        'endLine' => 27,
        'startColumn' => 5,
        'endColumn' => 5,
        'couldThrow' => false,
        'isClosure' => false,
        'isGenerator' => false,
        'isVariadic' => false,
        'modifiers' => 1,
        'namespace' => 'Illuminate\\Database\\Schema',
        'declaringClassName' => 'Illuminate\\Database\\Schema\\ForeignKeyDefinition',
        'implementingClassName' => 'Illuminate\\Database\\Schema\\ForeignKeyDefinition',
        'currentClassName' => 'Illuminate\\Database\\Schema\\ForeignKeyDefinition',
        'aliasName' => NULL,
      ),
      'restrictOnUpdate' => 
      array (
        'name' => 'restrictOnUpdate',
        'parameters' => 
        array (
        ),
        'returnsReference' => false,
        'returnType' => NULL,
        'attributes' => 
        array (
        ),
        'docComment' => '/**
 * Indicate that updates should be restricted.
 *
 * @return $this
 */',
        'startLine' => 34,
        'endLine' => 37,
        'startColumn' => 5,
        'endColumn' => 5,
        'couldThrow' => false,
        'isClosure' => false,
        'isGenerator' => false,
        'isVariadic' => false,
        'modifiers' => 1,
        'namespace' => 'Illuminate\\Database\\Schema',
        'declaringClassName' => 'Illuminate\\Database\\Schema\\ForeignKeyDefinition',
        'implementingClassName' => 'Illuminate\\Database\\Schema\\ForeignKeyDefinition',
        'currentClassName' => 'Illuminate\\Database\\Schema\\ForeignKeyDefinition',
        'aliasName' => NULL,
      ),
      'nullOnUpdate' => 
      array (
        'name' => 'nullOnUpdate',
        'parameters' => 
        array (
        ),
        'returnsReference' => false,
        'returnType' => NULL,
        'attributes' => 
        array (
        ),
        'docComment' => '/**
 * Indicate that updates should set the foreign key value to null.
 *
 * @return $this
 */',
        'startLine' => 44,
        'endLine' => 47,
        'startColumn' => 5,
        'endColumn' => 5,
        'couldThrow' => false,
        'isClosure' => false,
        'isGenerator' => false,
        'isVariadic' => false,
        'modifiers' => 1,
        'namespace' => 'Illuminate\\Database\\Schema',
        'declaringClassName' => 'Illuminate\\Database\\Schema\\ForeignKeyDefinition',
        'implementingClassName' => 'Illuminate\\Database\\Schema\\ForeignKeyDefinition',
        'currentClassName' => 'Illuminate\\Database\\Schema\\ForeignKeyDefinition',
        'aliasName' => NULL,
      ),
      'noActionOnUpdate' => 
      array (
        'name' => 'noActionOnUpdate',
        'parameters' => 
        array (
        ),
        'returnsReference' => false,
        'returnType' => NULL,
        'attributes' => 
        array (
        ),
        'docComment' => '/**
 * Indicate that updates should have "no action".
 *
 * @return $this
 */',
        'startLine' => 54,
        'endLine' => 57,
        'startColumn' => 5,
        'endColumn' => 5,
        'couldThrow' => false,
        'isClosure' => false,
        'isGenerator' => false,
        'isVariadic' => false,
        'modifiers' => 1,
        'namespace' => 'Illuminate\\Database\\Schema',
        'declaringClassName' => 'Illuminate\\Database\\Schema\\ForeignKeyDefinition',
        'implementingClassName' => 'Illuminate\\Database\\Schema\\ForeignKeyDefinition',
        'currentClassName' => 'Illuminate\\Database\\Schema\\ForeignKeyDefinition',
        'aliasName' => NULL,
      ),
      'cascadeOnDelete' => 
      array (
        'name' => 'cascadeOnDelete',
        'parameters' => 
        array (
        ),
        'returnsReference' => false,
        'returnType' => NULL,
        'attributes' => 
        array (
        ),
        'docComment' => '/**
 * Indicate that deletes should cascade.
 *
 * @return $this
 */',
        'startLine' => 64,
        'endLine' => 67,
        'startColumn' => 5,
        'endColumn' => 5,
        'couldThrow' => false,
        'isClosure' => false,
        'isGenerator' => false,
        'isVariadic' => false,
        'modifiers' => 1,
        'namespace' => 'Illuminate\\Database\\Schema',
        'declaringClassName' => 'Illuminate\\Database\\Schema\\ForeignKeyDefinition',
        'implementingClassName' => 'Illuminate\\Database\\Schema\\ForeignKeyDefinition',
        'currentClassName' => 'Illuminate\\Database\\Schema\\ForeignKeyDefinition',
        'aliasName' => NULL,
      ),
      'restrictOnDelete' => 
      array (
        'name' => 'restrictOnDelete',
        'parameters' => 
        array (
        ),
        'returnsReference' => false,
        'returnType' => NULL,
        'attributes' => 
        array (
        ),
        'docComment' => '/**
 * Indicate that deletes should be restricted.
 *
 * @return $this
 */',
        'startLine' => 74,
        'endLine' => 77,
        'startColumn' => 5,
        'endColumn' => 5,
        'couldThrow' => false,
        'isClosure' => false,
        'isGenerator' => false,
        'isVariadic' => false,
        'modifiers' => 1,
        'namespace' => 'Illuminate\\Database\\Schema',
        'declaringClassName' => 'Illuminate\\Database\\Schema\\ForeignKeyDefinition',
        'implementingClassName' => 'Illuminate\\Database\\Schema\\ForeignKeyDefinition',
        'currentClassName' => 'Illuminate\\Database\\Schema\\ForeignKeyDefinition',
        'aliasName' => NULL,
      ),
      'nullOnDelete' => 
      array (
        'name' => 'nullOnDelete',
        'parameters' => 
        array (
        ),
        'returnsReference' => false,
        'returnType' => NULL,
        'attributes' => 
        array (
        ),
        'docComment' => '/**
 * Indicate that deletes should set the foreign key value to null.
 *
 * @return $this
 */',
        'startLine' => 84,
        'endLine' => 87,
        'startColumn' => 5,
        'endColumn' => 5,
        'couldThrow' => false,
        'isClosure' => false,
        'isGenerator' => false,
        'isVariadic' => false,
        'modifiers' => 1,
        'namespace' => 'Illuminate\\Database\\Schema',
        'declaringClassName' => 'Illuminate\\Database\\Schema\\ForeignKeyDefinition',
        'implementingClassName' => 'Illuminate\\Database\\Schema\\ForeignKeyDefinition',
        'currentClassName' => 'Illuminate\\Database\\Schema\\ForeignKeyDefinition',
        'aliasName' => NULL,
      ),
      'noActionOnDelete' => 
      array (
        'name' => 'noActionOnDelete',
        'parameters' => 
        array (
        ),
        'returnsReference' => false,
        'returnType' => NULL,
        'attributes' => 
        array (
        ),
        'docComment' => '/**
 * Indicate that deletes should have "no action".
 *
 * @return $this
 */',
        'startLine' => 94,
        'endLine' => 97,
        'startColumn' => 5,
        'endColumn' => 5,
        'couldThrow' => false,
        'isClosure' => false,
        'isGenerator' => false,
        'isVariadic' => false,
        'modifiers' => 1,
        'namespace' => 'Illuminate\\Database\\Schema',
        'declaringClassName' => 'Illuminate\\Database\\Schema\\ForeignKeyDefinition',
        'implementingClassName' => 'Illuminate\\Database\\Schema\\ForeignKeyDefinition',
        'currentClassName' => 'Illuminate\\Database\\Schema\\ForeignKeyDefinition',
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