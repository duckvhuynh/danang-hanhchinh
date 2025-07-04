import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import type { AdministrativeOffice } from "../../data/administrative-offices";

interface EditOfficeModalProps {
  office: AdministrativeOffice | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (office: AdministrativeOffice, updates: Partial<AdministrativeOffice>) => void;
}

export function EditOfficeModal({
  office,
  isOpen,
  onClose,
  onSave
}: EditOfficeModalProps) {
  const [formData, setFormData] = useState<Partial<AdministrativeOffice>>({});

  useEffect(() => {
    if (office && isOpen) {
      setFormData({
        name: office.name,
        address: office.address,
        phone: office.phone || '',
        region: office.region,
        layer: office.layer,
        radius: office.radius,
        receptionRadius: office.receptionRadius,
        managementRadius: office.managementRadius,
        type: office.type,
        postid: office.postid,
        procedures_2024: office.procedures_2024 || 0,
        procedures_6months_2025: office.procedures_6months_2025 || 0,
        old_commune_ward: office.old_commune_ward || ''
      });
    }
  }, [office, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (office) {
      onSave(office, formData);
      onClose();
    }
  };

  const handleClose = () => {
    setFormData({});
    onClose();
  };

  if (!office) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa thông tin trụ sở</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Tên trụ sở *</Label>
            <Input
              id="name"
              value={formData.name || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Nhập tên trụ sở"
              required
            />
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">Địa chỉ *</Label>
            <Input
              id="address"
              value={formData.address || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Nhập địa chỉ"
              required
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Số điện thoại</Label>
            <Input
              id="phone"
              value={formData.phone || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="Nhập số điện thoại"
            />
          </div>

          {/* Region */}
          <div className="space-y-2">
            <Label htmlFor="region">Khu vực *</Label>
            <Input
              id="region"
              value={formData.region || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, region: e.target.value }))}
              placeholder="Nhập khu vực"
              required
            />
          </div>

          {/* Layer */}
          <div className="space-y-2">
            <Label htmlFor="layer">Lớp *</Label>
            <Select
              value={formData.layer}
              onValueChange={(value: 'A' | 'B' | 'C') => setFormData(prev => ({ ...prev, layer: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn lớp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span>Lớp A - Chi nhánh (2 bán kính)</span>
                  </div>
                </SelectItem>
                <SelectItem value="B">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span>Lớp B - Điểm tiếp nhận (theo loại vùng)</span>
                  </div>
                </SelectItem>
                <SelectItem value="C">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>Lớp C - Điểm tăng cường (bưu điện)</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Radius Controls - Conditional based on layer */}
          {formData.layer === 'A' && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Bán kính Lớp A (km)</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="receptionRadius" className="text-xs text-orange-700">Tiếp nhận</Label>
                  <Input
                    id="receptionRadius"
                    type="number"
                    min="1"
                    max="20"
                    step="0.5"
                    value={formData.receptionRadius || 5}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      receptionRadius: Number(e.target.value),
                      radius: Number(e.target.value) // Update main radius to reception
                    }))}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="managementRadius" className="text-xs text-red-700">Quản lý</Label>
                  <Input
                    id="managementRadius"
                    type="number"
                    min="1"
                    max="30"
                    step="0.5"
                    value={formData.managementRadius || 15}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      managementRadius: Number(e.target.value)
                    }))}
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {formData.layer === 'B' && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="type">Loại vùng *</Label>
                <Select
                  value={formData.type || 'urban'}
                  onValueChange={(value: 'urban' | 'suburban') => setFormData(prev => ({ 
                    ...prev, 
                    type: value,
                    radius: value === 'urban' ? 3 : 8 // Update radius based on type
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn loại vùng" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urban">Đô thị (3km)</SelectItem>
                    <SelectItem value="suburban">Ngoại ô (8km)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="radius">Bán kính phục vụ (km) *</Label>
                <Input
                  id="radius"
                  type="number"
                  min="1"
                  max="20"
                  step="0.5"
                  value={formData.radius || (formData.type === 'urban' ? 3 : 8)}
                  onChange={(e) => setFormData(prev => ({ ...prev, radius: Number(e.target.value) }))}
                  required
                />
              </div>
            </div>
          )}

          {formData.layer === 'C' && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="postid">Mã bưu điện</Label>
                <Input
                  id="postid"
                  value={formData.postid || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, postid: e.target.value }))}
                  placeholder="Nhập mã bưu điện (nếu có)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="radius">Bán kính phục vụ (km) *</Label>
                <Input
                  id="radius"
                  type="number"
                  min="1"
                  max="20"
                  step="0.5"
                  value={formData.radius || 5}
                  onChange={(e) => setFormData(prev => ({ ...prev, radius: Number(e.target.value) }))}
                  required
                />
              </div>
            </div>
          )}

          {/* Old commune ward */}
          <div className="space-y-2">
            <Label htmlFor="old_commune_ward">Phường/Xã cũ</Label>
            <Input
              id="old_commune_ward"
              value={formData.old_commune_ward || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, old_commune_ward: e.target.value }))}
              placeholder="Nhập phường/xã cũ (nếu có)"
            />
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="procedures_2024">Hồ sơ 2024</Label>
              <Input
                id="procedures_2024"
                type="number"
                min="0"
                value={formData.procedures_2024 || 0}
                onChange={(e) => setFormData(prev => ({ ...prev, procedures_2024: Number(e.target.value) }))}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="procedures_6months_2025">Hồ sơ 6 tháng 2025</Label>
              <Input
                id="procedures_6months_2025"
                type="number"
                min="0"
                value={formData.procedures_6months_2025 || 0}
                onChange={(e) => setFormData(prev => ({ ...prev, procedures_6months_2025: Number(e.target.value) }))}
                placeholder="0"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Hủy
            </Button>
            <Button type="submit">
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
