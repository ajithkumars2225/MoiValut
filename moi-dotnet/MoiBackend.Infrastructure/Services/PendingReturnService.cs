using Microsoft.EntityFrameworkCore;
using MoiBackend.Core.DTOs;
using MoiBackend.Core.Entities;
using MoiBackend.Core.Interfaces;
using MoiBackend.Infrastructure.Data;

namespace MoiBackend.Infrastructure.Services;

public class PendingReturnService : IPendingReturnService
{
    private readonly MoiDbContext _context;

    public PendingReturnService(MoiDbContext context)
    {
        _context = context;
    }

    public async Task<PendingReturnResponse> CreatePendingReturnAsync(PendingReturnRequest request)
    {
        var entity = new PendingReturn
        {
            ContributorName  = request.ContributorName.Trim(),
            Village          = request.Village?.Trim(),
            ReceivedAmount   = request.ReceivedAmount,
            Occasion         = request.Occasion?.Trim(),
            Status           = string.IsNullOrWhiteSpace(request.Status) ? "Pending" : request.Status.Trim(),
            Notes            = request.Notes?.Trim(),
            CreatedAt        = DateTime.UtcNow,
            MoiTransactionId = request.MoiTransactionId,
            GivenMoiEntryId  = request.GivenMoiEntryId,
            EventId          = request.EventId
        };

        _context.PendingReturns.Add(entity);
        await _context.SaveChangesAsync();

        return MapToResponse(entity);
    }

    public async Task<PendingReturnResponse> UpdatePendingReturnAsync(long id, PendingReturnRequest request)
    {
        var entity = await _context.PendingReturns.FindAsync(id);
        if (entity == null)
        {
            throw new KeyNotFoundException($"Pending return record with ID {id} not found.");
        }

        entity.ContributorName  = request.ContributorName.Trim();
        entity.Village          = request.Village?.Trim();
        entity.ReceivedAmount   = request.ReceivedAmount;
        entity.Occasion         = request.Occasion?.Trim();
        entity.Status           = string.IsNullOrWhiteSpace(request.Status) ? entity.Status : request.Status.Trim();
        entity.Notes            = request.Notes?.Trim();
        if (request.ClosedAt.HasValue)
        {
            entity.ClosedAt = request.ClosedAt.Value;
        }
        else if (request.Status == "ClosedWithEntry" || request.Status == "ClosedWithoutEntry")
        {
            entity.ClosedAt ??= DateTime.UtcNow;
        }
        entity.MoiTransactionId = request.MoiTransactionId ?? entity.MoiTransactionId;
        entity.GivenMoiEntryId  = request.GivenMoiEntryId ?? entity.GivenMoiEntryId;
        entity.EventId          = request.EventId ?? entity.EventId;

        await _context.SaveChangesAsync();

        return MapToResponse(entity);
    }

    public async Task<List<PendingReturnResponse>> GetAllPendingReturnsAsync()
    {
        var list = await _context.PendingReturns
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();

        return list.Select(MapToResponse).ToList();
    }

    public async Task<List<PendingReturnResponse>> GetPendingReturnsByEventAsync(long eventId)
    {
        var list = await _context.PendingReturns
            .Where(x => x.EventId == eventId || x.EventId == null)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();

        return list.Select(MapToResponse).ToList();
    }

    public async Task DeletePendingReturnAsync(long id)
    {
        var entity = await _context.PendingReturns.FindAsync(id);
        if (entity != null)
        {
            try
            {
                _context.PendingReturns.Remove(entity);
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                // Already deleted
            }
        }
    }

    private static PendingReturnResponse MapToResponse(PendingReturn entity)
    {
        return new PendingReturnResponse
        {
            Id               = entity.Id,
            ContributorName  = entity.ContributorName,
            Village          = entity.Village,
            ReceivedAmount   = entity.ReceivedAmount,
            Occasion         = entity.Occasion,
            Status           = entity.Status,
            CreatedAt        = entity.CreatedAt,
            ClosedAt         = entity.ClosedAt,
            Notes            = entity.Notes,
            MoiTransactionId = entity.MoiTransactionId,
            GivenMoiEntryId  = entity.GivenMoiEntryId,
            EventId          = entity.EventId
        };
    }
}
