import { ROUTES_PATH } from '../constants/routes.js'
import Logout from "./Logout.js"

export default class NewBill {
  constructor({ document, onNavigate, store, localStorage }) {
    this.document = document
    this.onNavigate = onNavigate
    this.store = store

    this.formData
    const verticalButtonDash = document.getElementById('layout-icon1')
    if (verticalButtonDash) verticalButtonDash.addEventListener('click', this.handleClickWindows)
    const formNewBill = this.document.querySelector(`form[data-testid="form-new-bill"]`)
    formNewBill.addEventListener("submit", this.handleSubmit)
    const file = this.document.querySelector(`input[data-testid="file"]`)
    file.addEventListener("change", this.handleChangeFile)
    this.fileUrl = null
    this.fileName = null
    this.billId = null
    new Logout({ document, localStorage, onNavigate })
  }

  handleClickWindows = () => {
    this.onNavigate(ROUTES_PATH['Bills'])
  }

  handleChangeFile = e => {
    e.preventDefault();
    const fileInput = document.querySelector(`input[data-testid="file"]`);
    const file = fileInput.files[0];
    if (!file) return;

    const user = JSON.parse(localStorage.getItem("user"));
    const email = user ? user.email : null;
    if (file.type === 'image/png' || file.type === 'image/jpg' || file.type === 'image/jpeg') {
      this.formData = new FormData()
      this.formData.append('file', file);
      this.formData.append('email', email);
    } else {
      console.log("Le fichier: ", file.name, "est de type ", file.type)
      alert("Le justificatif doit être une image (format png, jpg ou jpeg uniquement)");

    }
    
  }
  handleSubmit = async e => {
    e.preventDefault()
    
    const fileInput = document.querySelector(`input[data-testid="file"]`);
    const file = fileInput.files[0];   
    if (!file) return; 
    this.fileName = file.name
    const dateRegExp = new RegExp(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i)
    if (file.type === 'image/png' ||
      file.type === 'image/jpg' ||
      file.type === 'image/jpeg') {
        if(e.target.querySelector(`input[data-testid="amount"]`).value !== "" &&
          e.target.querySelector(`input[data-testid="pct"]`).value !== "" &&
          dateRegExp.test(e.target.querySelector(`input[data-testid="datepicker"]`).value)) {
            this.createBill(this.formData)
            .then(() => {
              const email = JSON.parse(localStorage.getItem("user")).email
              const bill = {
                email,
                type: e.target.querySelector(`select[data-testid="expense-type"]`).value,
                name:  e.target.querySelector(`input[data-testid="expense-name"]`).value,
                amount: parseInt(e.target.querySelector(`input[data-testid="amount"]`).value),
                date:  e.target.querySelector(`input[data-testid="datepicker"]`).value,
                vat: e.target.querySelector(`input[data-testid="vat"]`).value,
                pct: parseInt(e.target.querySelector(`input[data-testid="pct"]`).value) || 20,
                commentary: e.target.querySelector(`textarea[data-testid="commentary"]`).value,
                fileUrl: this.fileUrl,
                fileName: this.fileName,
                status: 'pending'
              }
              this.updateBill(bill)
            })
          }      
    } else { 
      console.log("Le fichier: ", file.name, "est de type ", file.type)
      alert("Le justificatif doit être une image (format png, jpg ou jpeg uniquement)");
    }
  }

  createBill = async (datas) => {
    return this.store
      .bills()
      .create({
        data: datas,
        headers: {
          noContentType: true
        }
      })
      .then(({filePath, key}) => {
        this.billId = key
        this.fileUrl = filePath
      }).catch(error => console.error(error))
  }
  // not need to cover this function by tests
  updateBill = (bill) => {
    if (this.store) {
      this.store
      .bills()
      .update({data: JSON.stringify(bill), selector: this.billId})
      .then(() => {
        this.onNavigate(ROUTES_PATH['Bills'])
      })
      .catch(error => console.error(error))
    }
  }
}