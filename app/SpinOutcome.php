<?php

namespace App;

class SpinOutcome
{
    public function multiplier(): int
    {
        $roll = random_int(1, 100);

        return match (true) {
            $roll <= 55 => 0, $roll <= 80 => 1, $roll <= 95 => 2, default => 5
        };
    }
}
