from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class InitiateResult:
    redirect_url: str
    authority: str


class PaymentGateway(ABC):
    """Common contract every payment driver implements (Strategy pattern)."""

    name: str = "base"

    @abstractmethod
    def initiate(self, payment, callback_url: str) -> InitiateResult:
        """Register the transaction and return where to send the user."""

    @abstractmethod
    def verify(self, payment, request) -> bool:
        """Confirm the transaction from the gateway callback. True on success."""
