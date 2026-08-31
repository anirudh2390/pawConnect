const Report = require('../models/Report');
const mongoose = require('mongoose');

// ── GET /api/admin/reports ────────────────────────────────────────────────────
// Returns paginated reports list
const getAllReports = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, status = '' } = req.query;

        const filter = {};
        if (status && ['Open', 'Resolved', 'Dismissed'].includes(status)) {
            filter.status = status;
        }

        const total = await Report.countDocuments(filter);
        const reports = await Report.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit))
            .populate('reportedBy', 'name email')
            .populate('resolvedBy', 'name email');

        return res.status(200).json({
            status: 'success',
            total,
            page: Number(page),
            pages: Math.ceil(total / limit),
            reports,
        });
    } catch (err) {
        next(err);
    }
};

// ── GET /api/admin/reports/stats ──────────────────────────────────────────────
// Report statistics
const getReportStats = async (req, res, next) => {
    try {
        const totalReports = await Report.countDocuments();
        const openReports = await Report.countDocuments({ status: 'Open' });
        const resolvedReports = await Report.countDocuments({ status: 'Resolved' });
        const dismissedReports = await Report.countDocuments({ status: 'Dismissed' });

        return res.status(200).json({
            status: 'success',
            stats: { totalReports, openReports, resolvedReports, dismissedReports },
        });
    } catch (err) {
        next(err);
    }
};

// ── POST /api/admin/reports ───────────────────────────────────────────────────
// Submit a new report (any authenticated user)
const createReport = async (req, res, next) => {
    try {
        const { targetType, targetId, reason, details } = req.body;

        if (!targetType || !targetId || !reason) {
            return res.status(400).json({ status: 'error', message: 'targetType, targetId, and reason are required' });
        }

        if (!mongoose.Types.ObjectId.isValid(targetId)) {
            return res.status(400).json({ status: 'error', message: 'Invalid target ID' });
        }

        const report = await Report.create({
            reportedBy: req.user.id,
            targetType,
            targetId,
            reason,
            details: details || '',
        });

        return res.status(201).json({
            status: 'success',
            message: 'Report submitted successfully',
            report,
        });
    } catch (err) {
        next(err);
    }
};

// ── PATCH /api/admin/reports/:id/resolve ─────────────────────────────────────
// Resolve or dismiss a report
const resolveReport = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { resolution, resolutionNote = '' } = req.body; // resolution: 'Resolved' | 'Dismissed'

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ status: 'error', message: 'Invalid report ID' });
        }

        if (!['Resolved', 'Dismissed'].includes(resolution)) {
            return res.status(400).json({ status: 'error', message: 'resolution must be "Resolved" or "Dismissed"' });
        }

        const report = await Report.findById(id);
        if (!report) {
            return res.status(404).json({ status: 'error', message: 'Report not found' });
        }

        report.status = resolution;
        report.resolvedBy = req.user.id;
        report.resolvedAt = new Date();
        report.resolutionNote = resolutionNote;
        await report.save();

        return res.status(200).json({
            status: 'success',
            message: `Report ${resolution.toLowerCase()} successfully`,
            report,
        });
    } catch (err) {
        next(err);
    }
};

// ── DELETE /api/admin/reports/:id ─────────────────────────────────────────────
// Delete a report permanently
const deleteReport = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ status: 'error', message: 'Invalid report ID' });
        }

        const report = await Report.findByIdAndDelete(id);
        if (!report) {
            return res.status(404).json({ status: 'error', message: 'Report not found' });
        }

        return res.status(200).json({ status: 'success', message: 'Report deleted' });
    } catch (err) {
        next(err);
    }
};

module.exports = { getAllReports, getReportStats, createReport, resolveReport, deleteReport };
