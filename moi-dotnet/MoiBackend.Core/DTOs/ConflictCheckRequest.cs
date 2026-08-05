namespace MoiBackend.Core.DTOs;

public class ConflictCheckRequest
{
    public string RecipientName { get; set; } = null!;
    public string? Village { get; set; }

    /// <summary>The amount they are giving us NOW (current Moi Entry)</summary>
    public decimal TheirCurrentAmount { get; set; }

    /// <summary>Prev Return — what we gave them before (from the Prev Return field)</summary>
    public decimal PrevReturnAmount { get; set; }

    public long? MoiTransactionId { get; set; }
    public long? EventId { get; set; }
}
