import React, { useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import notify from 'devextreme/ui/notify';
import api from "../../redux/authSlice";

const FirmaCreatePage = ({ firmaData = null, onClose, onSuccess }) => {
  // const api = useAxios();
 
  const initialValues = {
    id: null,
    full_name: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    country: '',
    postal_code: '',
  };

  const validationSchema = Yup.object().shape({
    full_name: Yup.string().required('Firma adı zorunludur.'),
    email: Yup.string().email('Geçerli bir email girin').required('Email zorunludur.'),
    phone: Yup.string().required('Telefon zorunludur.'),
    street: Yup.string().required('Sokak zorunludur.'),
    city: Yup.string().required('Şehir zorunludur.'),
    country: Yup.string().required('Ülke zorunludur.'),
    postal_code: Yup.string().required('Posta kodu zorunludur.')
  });

  const handleSubmit = async (values, { resetForm }) => {
    const payload = {
      id: values.id,
      full_name: values.full_name,
      email: values.email,
      phone: values.phone,
      address: {
        street: values.street,
        city: values.city,
        country: values.country,
        postal_code: values.postal_code
      }
    };

    try {
      if (values.id) {
        await api.put(`firmalar/${values.id}/`, payload);
        notify('Firma başarıyla güncellendi!', 'success', 3000);
      } else {
        await api.post('firmalar/', payload);
        notify('Firma başarıyla oluşturuldu!', 'success', 3000);
      }
      onSuccess();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Hata:', error);
      notify('İşlem sırasında hata oluştu.', 'error', 3000);
    }
  };

  const getInitialValues = () => {
    return firmaData ? {
      id: firmaData.id || null,
      full_name: firmaData.full_name || '',
      email: firmaData.email || '',
      phone: firmaData.phone || '',
      street: firmaData.address_data?.street || '',
      city: firmaData.address_data?.city || '',
      country: firmaData.address_data?.country || '',
      postal_code: firmaData.address_data?.postal_code || ''
    } : initialValues;
  };

  return (
    <div className="container">
      <h2>{firmaData?.id ? 'Firma Güncelle' : 'Yeni Firma Ekle'}</h2>
      <Formik initialValues={getInitialValues()} enableReinitialize validationSchema={validationSchema} onSubmit={handleSubmit}>
        {() => (
          <Form>
            <div className="row">
              <div className="col-md-6">
                <label>Firma Adı</label>
                <Field name="full_name" className="form-control" />
                <ErrorMessage name="full_name" component="div" className="text-danger" />
              </div>
              <div className="col-md-6">
                <label>Email</label>
                <Field name="email" className="form-control" type="email" />
                <ErrorMessage name="email" component="div" className="text-danger" />
              </div>
              <div className="col-md-6">
                <label>Telefon</label>
                <Field name="phone" className="form-control" />
                <ErrorMessage name="phone" component="div" className="text-danger" />
              </div>
              <div className="col-12 mt-3">
                <h4>Adres Bilgileri</h4>
              </div>
              <div className="col-md-6">
                <label>Sokak</label>
                <Field name="street" className="form-control" />
                <ErrorMessage name="street" component="div" className="text-danger" />
              </div>
              <div className="col-md-6">
                <label>Şehir</label>
                <Field name="city" className="form-control" />
                <ErrorMessage name="city" component="div" className="text-danger" />
              </div>
              <div className="col-md-6">
                <label>Ülke</label>
                <Field name="country" className="form-control" />
                <ErrorMessage name="country" component="div" className="text-danger" />
              </div>
              <div className="col-md-6">
                <label>Posta Kodu</label>
                <Field name="postal_code" className="form-control" />
                <ErrorMessage name="postal_code" component="div" className="text-danger" />
              </div>
            </div>
            <div className="mt-4 text-end">
              <button type="submit" className="btn btn-primary me-2">Kaydet</button>
              <button type="button" className="btn btn-secondary" onClick={onClose}>İptal</button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default FirmaCreatePage;