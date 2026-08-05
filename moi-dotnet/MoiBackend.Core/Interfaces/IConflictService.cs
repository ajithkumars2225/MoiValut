using MoiBackend.Core.DTOs;

namespace MoiBackend.Core.Interfaces;

public interface IConflictService
{
    /// <summary>
    /// Check for conflict WITHOUT saving to DB.
    /// Called when recording a Moi Entry — checks if this person is in Given Moi list.
    /// </summary>
    Task<ConflictCheckResponse> CheckConflictAsync(ConflictCheckRequest request);

    /// <summary>
    /// Check for conflict AND save the result to DB.
    /// </summary>
    Task<ConflictCheckResponse> CheckAndSaveConflictAsync(ConflictCheckRequest request);

    Task<List<ConflictCheckResponse>> GetAllConflictsAsync();
    Task<List<ConflictCheckResponse>> GetConflictsByEventAsync(long eventId);
    Task DeleteConflictAsync(long id);
}
