using MoiBackend.Core.DTOs;

namespace MoiBackend.Core.Interfaces;

public interface IPendingReturnService
{
    Task<PendingReturnResponse> CreatePendingReturnAsync(PendingReturnRequest request);
    Task<PendingReturnResponse> UpdatePendingReturnAsync(long id, PendingReturnRequest request);
    Task<List<PendingReturnResponse>> GetAllPendingReturnsAsync();
    Task<List<PendingReturnResponse>> GetPendingReturnsByEventAsync(long eventId);
    Task DeletePendingReturnAsync(long id);
}
