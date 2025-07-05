import * as XLSX from 'xlsx';
import type { AdministrativeOffice } from '../data/administrative-offices';

// Download data as JSON
export function downloadAsJSON(data: AdministrativeOffice[] | object, filename: string) {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

// Download data as Excel
export function downloadAsExcel(data: AdministrativeOffice[], filename: string, sheetName: string) {
  // Prepare data for Excel export with flattened structure
  const excelData = data.map(office => ({
    'ID': office.id,
    'Tên trụ sở': office.name,
    'Địa chỉ': office.address,
    'Khu vực': office.region,
    'Lớp': office.layer,
    'Bán kính chính (km)': office.radius,
    'Bán kính tiếp nhận (km)': office.receptionRadius || '', // Layer A only
    'Bán kính quản lý (km)': office.managementRadius || '', // Layer A only
    'Loại vùng': office.type || '', // Layer A only (urban/suburban)
    'Điện thoại': office.phone || '',
    'Xã/phường cũ': office.old_commune_ward || '', // Layer B only
    'Loại đơn vị': office.is_commune !== undefined ? (office.is_commune ? 'Xã' : 'Phường') : '', // Layer B only
    'Mã bưu điện': office.postid || '', // Layer C only
    'Vĩ độ (Latitude)': office.location.lat,
    'Kinh độ (Longitude)': office.location.lng,
    'Hồ sơ 2024': office.procedures_2024 || 0,
    'Hồ sơ 6 tháng đầu 2025': office.procedures_6months_2025 || 0,
  }));

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(excelData);

  // Set column widths for better readability
  const colWidths = [
    { wch: 15 }, // ID
    { wch: 40 }, // Tên trụ sở
    { wch: 50 }, // Địa chỉ
    { wch: 15 }, // Khu vực
    { wch: 10 }, // Lớp
    { wch: 15 }, // Bán kính chính
    { wch: 20 }, // Bán kính tiếp nhận
    { wch: 18 }, // Bán kính quản lý
    { wch: 12 }, // Loại vùng
    { wch: 15 }, // Điện thoại
    { wch: 20 }, // Xã/phường cũ
    { wch: 12 }, // Loại đơn vị
    { wch: 15 }, // Mã bưu điện
    { wch: 15 }, // Vĩ độ
    { wch: 15 }, // Kinh độ
    { wch: 15 }, // Hồ sơ 2024
    { wch: 20 }, // Hồ sơ 6 tháng đầu 2025
  ];
  ws['!cols'] = colWidths;

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // Generate buffer and download
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

// Download combined data for all layers as multi-sheet Excel
export function downloadAllLayersAsExcel(
  layerAData: AdministrativeOffice[],
  layerBData: AdministrativeOffice[],
  layerCData: AdministrativeOffice[],
  customData: AdministrativeOffice[],
  editedData: Map<string, AdministrativeOffice>,
  deletedOfficeIds: Set<string>,
  filename: string
) {
  const wb = XLSX.utils.book_new();

  // Helper function to prepare data for Excel export
  const prepareDataForExcel = (data: AdministrativeOffice[]) => {
    return data.map(office => ({
      'ID': office.id,
      'Tên trụ sở': office.name,
      'Địa chỉ': office.address,
      'Khu vực': office.region,
      'Lớp': office.layer,
      'Bán kính chính (km)': office.radius,
      'Bán kính tiếp nhận (km)': office.receptionRadius || '', // Layer A only
      'Bán kính quản lý (km)': office.managementRadius || '', // Layer A only
      'Loại vùng': office.type || '', // Layer A only (urban/suburban)
      'Điện thoại': office.phone || '',
      'Xã/phường cũ': office.old_commune_ward || '', // Layer B only
      'Loại đơn vị': office.is_commune !== undefined ? (office.is_commune ? 'Xã' : 'Phường') : '', // Layer B only
      'Mã bưu điện': office.postid || '', // Layer C only
      'Vĩ độ (Latitude)': office.location.lat,
      'Kinh độ (Longitude)': office.location.lng,
      'Hồ sơ 2024': office.procedures_2024 || 0,
      'Hồ sơ 6 tháng đầu 2025': office.procedures_6months_2025 || 0,
      'Trạng thái': office.id.startsWith('custom-') ? 'Thêm mới' : 
                   editedData.has(office.id) ? 'Đã chỉnh sửa' : 
                   deletedOfficeIds.has(office.id) ? 'Đã xóa' : 'Gốc',
    }));
  };

  // Set column widths
  const colWidths = [
    { wch: 15 }, // ID
    { wch: 40 }, // Tên trụ sở
    { wch: 50 }, // Địa chỉ
    { wch: 15 }, // Khu vực
    { wch: 10 }, // Lớp
    { wch: 15 }, // Bán kính chính
    { wch: 20 }, // Bán kính tiếp nhận
    { wch: 18 }, // Bán kính quản lý
    { wch: 12 }, // Loại vùng
    { wch: 15 }, // Điện thoại
    { wch: 20 }, // Xã/phường cũ
    { wch: 12 }, // Loại đơn vị
    { wch: 15 }, // Mã bưu điện
    { wch: 15 }, // Vĩ độ
    { wch: 15 }, // Kinh độ
    { wch: 15 }, // Hồ sơ 2024
    { wch: 20 }, // Hồ sơ 6 tháng đầu 2025
    { wch: 15 }, // Trạng thái
  ];

  // Create worksheets for each layer
  if (layerAData.length > 0) {
    const wsA = XLSX.utils.json_to_sheet(prepareDataForExcel(layerAData));
    wsA['!cols'] = colWidths;
    XLSX.utils.book_append_sheet(wb, wsA, 'Lớp A - Chi nhánh quận huyện');
  }

  if (layerBData.length > 0) {
    const wsB = XLSX.utils.json_to_sheet(prepareDataForExcel(layerBData));
    wsB['!cols'] = colWidths;
    XLSX.utils.book_append_sheet(wb, wsB, 'Lớp B - TT hành chính mới');
  }

  if (layerCData.length > 0) {
    const wsC = XLSX.utils.json_to_sheet(prepareDataForExcel(layerCData));
    wsC['!cols'] = colWidths;
    XLSX.utils.book_append_sheet(wb, wsC, 'Lớp C - Điểm bưu điện');
  }

  // Create custom offices sheet if any exist
  if (customData.length > 0) {
    const wsCustom = XLSX.utils.json_to_sheet(prepareDataForExcel(customData));
    wsCustom['!cols'] = colWidths;
    XLSX.utils.book_append_sheet(wb, wsCustom, 'Trụ sở tùy chỉnh');
  }

  // Create summary sheet
  const summaryData = [
    ['Loại dữ liệu', 'Số lượng', 'Mô tả'],
    ['Lớp A - Chi nhánh quận/huyện', layerAData.length, 'Chi nhánh hành chính cấp quận/huyện cũ với 2 bán kính (tiếp nhận & quản lý)'],
    ['Lớp B - Trung tâm mới', layerBData.length, 'Trung tâm hành chính cấp xã/phường mới sau sáp nhập'],
    ['Lớp C - Điểm bưu điện', layerCData.length, 'Các điểm tiếp nhận do bưu điện quản lý'],
    ['Trụ sở tùy chỉnh', customData.length, 'Các trụ sở được thêm mới trong chế độ chỉnh sửa'],
    ['Đã chỉnh sửa', editedData.size, 'Số trụ sở gốc đã được chỉnh sửa'],
    ['Đã ẩn', deletedOfficeIds.size, 'Số trụ sở gốc đã được ẩn'],
    [],
    ['Lưu ý về bán kính:'],
    ['- Lớp A: Có 2 bán kính dựa theo loại vùng (đô thị/ngoại thành)'],
    ['  + Đô thị: Tiếp nhận 2.5km, Quản lý 5km'],
    ['  + Ngoại thành: Tiếp nhận 5km, Quản lý 10km'],
    ['- Lớp B: Bán kính cố định 5km'],
    ['- Lớp C: Bán kính mặc định 5km (có thể điều chỉnh)'],
    [],
    ['Ngày xuất', new Date().toLocaleDateString('vi-VN')],
    ['Thời gian xuất', new Date().toLocaleTimeString('vi-VN')],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Tổng quan');

  // Generate buffer and download
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

// Generate filename with timestamp
export function generateFilename(prefix: string): string {
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const time = now.toTimeString().split(' ')[0].replace(/:/g, '-');
  return `${prefix}_${date}_${time}`;
}
