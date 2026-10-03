<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class WalletRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'amount' => ['required', 'numeric', 'decimal:0,2', 'min:1', 'max:10000'],
            'method' => [Rule::requiredIf($this->routeIs('wallet.deposit')), 'nullable', Rule::in(['card', 'bank', 'apple', 'crypto'])],
            'request_id' => ['required', 'uuid'],
        ];
    }
}
