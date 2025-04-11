<?php

declare(strict_types=1);

namespace MakairaConnectFrontend\Makaira\Api\Exception;

use Symfony\Contracts\HttpClient\ResponseInterface;

class ApiException extends \Exception
{
    public function __construct(
        string $message,
        int $code = 0,
        ?\Throwable $previous = null,
        protected readonly ?ResponseInterface $apiResponse = null,
    ) {
        parent::__construct($message, $code, $previous);
    }

    public function getApiResponse(): ?ResponseInterface
    {
        return $this->apiResponse;
    }

    public static function fromResponse(ResponseInterface $response): self
    {
        $responseBody = $response->toArray(false);

        $message = 'The API did return an error';
        if (isset($responseBody['message'])) {
            $message .= ': ' . $responseBody['message'];
        }

        return new self($message, 0, null, $response);
    }
}
